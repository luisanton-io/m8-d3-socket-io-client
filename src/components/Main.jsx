import { useState, useEffect } from "react"
import { Container, Row, Form, ListGroup } from "react-bootstrap"
import { io } from "socket.io-client"
import uniqid from "uniqid"

const ENDPOINT = "http://localhost:3030"

const socket = io(ENDPOINT, { transports: ["websocket"] })

export default function Main() {

    const [connected, setConnected] = useState(false)
    const [username, setUsername] = useState("")
    const [text, setText] = useState("")
    const [chatHistory, setChatHistory] = useState([])
    const [onlineUsers, setOnlineUsers] = useState([])

    const getOnlineUsers = async () => {
        const response = await fetch(ENDPOINT + "/online-users")
        const { onlineUsers } = await response.json()

        setOnlineUsers(onlineUsers)
    }

    useEffect(() => {
        socket.on("connect", () => {
            console.log(socket.id)
        })

        socket.on("loggedin", () => {

            socket.on("message", message => {
                console.log(message)
                setChatHistory(h => [...h, message])
            })

            setConnected(true)
            getOnlineUsers()

        })

        socket.on("newConnection", () => {
            getOnlineUsers()
        })

        return () => { socket.disconnect() }
    }, [])

    const handleUsernameChange = e => {
        setUsername(e.target.value)
    }

    const handleUsernameSubmit = e => {
        e.preventDefault()
        console.log("submitting new username")
        socket.emit("setUsername", { username })
    }


    const handleMessageChange = e => {
        setText(e.target.value)
    }

    const handleMessageSubmit = e => {
        e.preventDefault()
        console.log("sending new message")
        const message = {
            sender: username,
            text,
            id: socket.id,
            timestamp: Date.now()
        }
        socket.emit("sendmessage", message)

        setText("")
        setChatHistory(h => [...h, message])
    }

    return <Container>
        <Row className="flex-column" style={{ height: '95vh' }}>

            <Form onSubmit={handleUsernameSubmit} className="my-3">
                <ListGroup className="mb-3">
                    {
                        onlineUsers.map(user => (
                            <ListGroup.Item key={uniqid()}>{user.username} {user.id}</ListGroup.Item>
                        ))
                    }
                </ListGroup>
                <Form.Control value={username} onChange={handleUsernameChange} />
            </Form>

            <ul style={{ flexGrow: 1 }}>
                {
                    chatHistory.map(message => (
                        <li key={uniqid()}>
                            <strong className="me-2">{message.sender}</strong>
                            <span>{message.text}</span>
                        </li>
                    ))
                }
            </ul>

            <Form onSubmit={handleMessageSubmit}>
                <Form.Control value={text} onChange={handleMessageChange} disabled={!connected} />
            </Form>
        </Row>
    </Container>
}