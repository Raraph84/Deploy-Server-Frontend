import { Component, createRef } from "react";
import { createRoot } from "react-dom/client";
import moment from "moment";

import "./style.scss";

class Website extends Component {

    constructor(props) {

        super(props);

        this.logsTextAreaRef = createRef();

        this.ws = null;

        this.state = { hebergs: [], currentHeberg: null };
    }

    connect() {

        this.ws = new WebSocket(process.env.REACT_APP_SERVER_HOST);

        this.ws.addEventListener("open", () => {

            this.ws.send(JSON.stringify({
                command: "LOGIN",
                token: process.env.REACT_APP_TOKEN
            }));
        });

        this.ws.addEventListener("message", (event) => {

            let message;
            try {
                message = JSON.parse(event.data);
            } catch (error) {
                return;
            }

            if (message.event === "SERVER") {

                this.state.hebergs.push({ id: message.id, name: message.name, logs: [] });
                this.setState({ hebergs: this.state.hebergs });

            } else if (message.event === "LOG") {

                this.state.hebergs.find((heberg) => heberg.id === message.serverId).logs.push(...message.logs);
                this.setState({ hebergs: this.state.hebergs });

            } else if (message.event === "HEARTBEAT") {

                this.ws.send(JSON.stringify({ command: "HEARTBEAT" }));
            }
        });

        this.ws.addEventListener("close", () => {

            this.setState({ hebergs: [], currentHeberg: null });

            setTimeout(() => this.connect(), 1000);
        });
    }

    componentDidMount() {
        this.connect();
    }

    componentDidUpdate() {
        this.logsTextAreaRef.current.scrollTop = this.logsTextAreaRef.current.scrollHeight;
    }

    render() {
        return <div className="website">

            <div className="menu">
                {this.state.hebergs.map((heberg) => <button key={heberg.id} className={this.state.currentHeberg !== heberg.id ? "" : "active"}
                    onClick={() => this.setState({ currentHeberg: heberg.id })}>{heberg.name}</button>)}
            </div>

            <textarea ref={this.logsTextAreaRef} readOnly value={this.state.currentHeberg !== null ? this.state.hebergs
                .find((heberg) => this.state.currentHeberg === heberg.id).logs
                .sort((a, b) => a.date - b.date)
                .map((log) => moment(log.date).format("[[]DD/MM/YYYY HH:mm:ss[]] ") + log.line)
                .join("\n") : null} />

        </div>;
    }
}

createRoot(document.getElementById("root")).render(<Website />);
