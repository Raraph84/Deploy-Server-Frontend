import React from "react";
import ReactDOM from "react-dom";

import "./style.scss";

class Website extends React.Component {

    constructor(props) {

        super(props);

        this.textArea = React.createRef();

        this.ws = null;

        this.state = { hebergs: [], currentHeberg: -1 };
    }

    connect() {

        this.ws = new WebSocket("wss://gateway.hebergs.primordium.fr");

        this.ws.addEventListener("open", () => {

            this.ws.send(JSON.stringify({
                command: "LOGIN",
                token: "59Ykw7UwHDSlcEUSwgnezTgvuii0QMQUDe3HGG5A"
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

                const heberg = { id: message.id, name: message.name, logs: [] };

                this.state.hebergs.push(heberg);
                this.setState({ hebergs: this.state.hebergs });

            } else if (message.event === "LOG") {

                this.state.hebergs.find((heberg) => heberg.id === message.serverId).logs.push(message.line);
                this.setState({ hebergs: this.state.hebergs });
            }
        });

        this.ws.addEventListener("close", () => {

            this.setState({ hebergs: [], currentHeberg: -1 });
            this.ws = null;

            setTimeout(() => this.connect(), 5000);
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

        return <div className="App">

            <div className="menu">{this.state.hebergs.map((heberg) => <button key={heberg.id} style={{ backgroundColor: this.state.currentHeberg === heberg.id ? "rgb(50, 50, 50)" : "" }} onClick={() => this.setState({ currentHeberg: heberg.id })}>{heberg.name}</button>)}</div>

            <textarea readOnly ref={this.textArea} value={this.state.currentHeberg === -1 ? "" : this.state.hebergs.find((heberg) => this.state.currentHeberg === heberg.id).logs.join("\n")} />

        </div>;
    }
}

ReactDOM.render(<React.StrictMode><Website /></React.StrictMode>, document.getElementById("root"));