import moment from "moment";
import { Component, createRef } from "react";
import { createRoot } from "react-dom/client";

import "./style.scss";

class Website extends Component {

    constructor(props) {

        super(props);

        this.textArea = createRef();
        this.ws = null;

        this.state = { hebergs: [], currentHeberg: -1 };
    }

    connect() {

        this.ws = new WebSocket("wss://gateway.raraph.fr/hebergs");

        this.ws.addEventListener("open", () => {

            this.ws.send(JSON.stringify({
                command: "LOGIN",
                token: "59Ykw7UwHDSlcEUSwgnezTgvuii0QMNGx6GsMMkCGybgoDpL42"
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
            }
        });

        this.ws.addEventListener("close", () => {

            this.setState({ hebergs: [], currentHeberg: -1 });

            setTimeout(() => this.connect(), 1000);
        });
    }

    componentDidMount() {
        this.connect();
    }

    componentDidUpdate() {
        this.textArea.current.scrollTop = this.textArea.current.scrollHeight;
    }

    render() {

        document.title = "Logs hébergements";

        return <div className="website">

            <div className="menu">{this.state.hebergs.map((heberg) => <button key={heberg.id}
                style={{ backgroundColor: this.state.currentHeberg === heberg.id ? "rgb(50, 50, 50)" : "" }}
                onClick={() => this.setState({ currentHeberg: heberg.id })}
            >{heberg.name}</button>)}</div>

            <textarea readOnly ref={this.textArea} value={this.state.currentHeberg === -1 ? "" : this.state.hebergs
                .find((heberg) => this.state.currentHeberg === heberg.id).logs
                .sort((a, b) => a.date - b.date)
                .map((log) => moment(log.date).format("[[]DD/MM/YYYY HH:mm[]] ") + log.line)
                .join("\n")} />

        </div>;
    }
}

createRoot(document.getElementById("root")).render(<Website />);
