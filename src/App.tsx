import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { db } from './firestore'
import { v4 as uuidv4 } from 'uuid'
import { doc, setDoc, onSnapshot } from '@firebase/firestore'

const Root = styled.div`
	display: flex;
	width: 100%;
	height: 100vh;
`

const Container = styled.div`
	height: 100%;
	width: 100%;
`

const MsgUser1 = styled.p`
	color: blue;
	margin: 20px;
`

const MsgUser2 = styled.p`
	color: green;
	margin: 20px;
`

export type Message = {
	user: string;
	timestamp: number;
	text: string;
};

const pushToFirebase = async (user: string, text: string): Promise<void> => {
	// we push to the database
	const now = Date.now()
 
	// the user object will be:
	// user: {
	// 	[randomUuid]: { 
	// 		messages: {
	// 			someTimeStamp: 'someMessage'
	// 			someOtherTimeStamp: 'someOtherMessage'
	// 		}
	// 	}
	// }

	const userRef = doc(db, `users/${user}`)
	setDoc(userRef, {
		messages: { [now]: text, },
	}, { merge: true, })
}  

const Player = ({ id, }: { id: string, }) => {
	// a controlled form where on submit we send some data to firebase
	const [ text, setText, ] = useState('')

	return (
		<div>
			Your message:
			<form onSubmit={(e) => {
				e.preventDefault()
				setText('')
				pushToFirebase(id, text)
			}}
			>
				<input value={text} onChange={e => setText(e.target.value)}/>
			</form>
		</div>
	)
}

const Chat = ({ id1, id2, }: { id1: string, id2: string, }): JSX.Element => {
	// TODO: Implement snapshot listeners on player 1 and player2. Display a chat of their messages.
	// https://firebase.google.com/docs/firestore/query-data/listen for snapshot documentation.
	// i have disabled all security, so you should not worry about that :)

	const [messages, setMessages, ] = useState<null | Message[]>(null)
	const [messages1, setMessages1, ] = useState<null | Message[]>(null)
	const [messages2, setMessages2, ] = useState<null | Message[]>(null)
	
	//to put the two groups of messages together in the same list and sort them by timestamp
	useEffect(()=> {
		const allMessages:Message[] = []
		messages1?.map((value) => {
			allMessages.push(value)
		})
		messages2?.map((value) => {
			allMessages.push(value)
		})
		const sortedMessages = allMessages.sort((a, b) => a.timestamp - b.timestamp)
		setMessages(sortedMessages)
	}, [messages1, messages2, ])


	useEffect(() => {
		//check for new messages of user 1
		onSnapshot(doc(db, `users/${id1}`), (querySnapshot) => {
			const newMessages: Message[] = []
			const data = querySnapshot.data()
			//if there is any data, put those messages into the list from user 1
			if (data) {
				const messageTexts = data.messages
				Object.keys(messageTexts).forEach((ts: string) => {
					newMessages.push({						
						user: id1,
						timestamp: Number(ts),
						text: messageTexts[ts],
					})
				})
			}
			setMessages1(newMessages)
		})

		//check for new messages of user 2
		onSnapshot(doc(db, `users/${id2}`), (querySnapshot2) => {
			const newMessages: Message[] = []
			const data = querySnapshot2.data()
			//if there is any data, put those messages into the list from user 2
			if (data) {
				const messageTexts = data.messages
				Object.keys(messageTexts).forEach((ts: string) => {
					newMessages.push({						
						user: id2,
						timestamp: Number(ts),
						text: messageTexts[ts],
					})
				})
			}
			setMessages2(newMessages)
		})

	}, [])

	return (
		<div>
			{messages?.map((message: Message, index: number) => {
				const msg = message?.text
				if (message?.user == id1) {
					return (
						<MsgUser1> {msg} </MsgUser1>
					)
				}
				else {
					return (
						<MsgUser2> {msg} </MsgUser2>
					)
				}
			})}
		</div>
	)
}

const App = (): JSX.Element => {
	// we generate a random uid for each player. We use this as their database id. 
	// note: this means you cannot retrieve chats on page reload!

	const [idPlayerOne,] = useState(uuidv4())
	const [idPlayerTwo,] = useState(uuidv4())

	return (
		<Root>
			<Container>
				<Player id={idPlayerOne} />
			</Container>
			<Container>
				<Chat id1={idPlayerOne} id2={idPlayerTwo} />
			</Container>
			<Container>
				<Player id={idPlayerTwo} />
			</Container>
		</Root>
	)
}

export default App
