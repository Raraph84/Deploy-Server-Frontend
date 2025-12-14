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

                this.state.hebergs.push({ id: message.id, name: message.name, type: message.type, state: message.state, logs: [] });
                this.setState({ hebergs: this.state.hebergs });

            } else if (message.event === "SERVER_STATE") {

                this.state.hebergs.find((heberg) => heberg.id === message.serverId).state = message.state;
                this.setState({ hebergs: this.state.hebergs });

            } else if (message.event === "LOG") {

                this.state.hebergs.find((heberg) => heberg.id === message.serverId).logs.push(...message.logs);
                this.setState({ hebergs: this.state.hebergs }, () => { if (message.serverId === this.state.currentHeberg) this.updateScroll(); });

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

    updateScroll() {
        if (this.logsTextAreaRef.current) this.logsTextAreaRef.current.scrollTop = this.logsTextAreaRef.current.scrollHeight;
    }

    render() {

        const currentServer = this.state.hebergs.find((heberg) => this.state.currentHeberg === heberg.id);

        return <div className="website">

            <div className="servers">
                {this.state.hebergs.map((heberg) => <button key={heberg.id} className={this.state.currentHeberg !== heberg.id ? "" : "active"}
                    onClick={() => this.setState({ currentHeberg: heberg.id }, () => this.updateScroll())}>{heberg.name}</button>)}
            </div>

            <div className="logs-menu">

                <textarea ref={this.logsTextAreaRef} readOnly value={currentServer?.logs
                    .sort((a, b) => a.date - b.date)
                    .map((log) => moment(log.date).format("[[]DD/MM/YYYY HH:mm:ss[]] ") + log.line)
                    .join("\n") || ""} />

                {currentServer && <div className="menu">
                    {currentServer.state && <>
                        <div>Statut : {{ stopped: "Arrêté", stopping: "Arrêt...", starting: "Démarrage...", started: "Démarré", restarting: "Redémarrage...", deploying: "Déploiement..." }[currentServer.state]}</div>
                        <button disabled={!["started", "stopped"].includes(currentServer.state)}
                            onClick={() => this.ws.send(JSON.stringify({ command: currentServer.state === "started" ? "STOP_SERVER" : "START_SERVER", serverId: currentServer.id }))}
                        >{currentServer.state === "started" ? "Arrêter" : "Démarrer"}</button>
                        <button disabled={!["started"].includes(currentServer.state)}
                            onClick={() => this.ws.send(JSON.stringify({ command: "RESTART_SERVER", serverId: currentServer.id }))}
                        >Redémarrer</button>
                    </>}
                    <button disabled={currentServer.state && !["started", "stopped"].includes(currentServer.state)}
                        onClick={() => this.ws.send(JSON.stringify({ command: "DEPLOY_SERVER", serverId: currentServer.id }))}
                    >Déployer</button>
                </div>}
            </div>

        </div>;
    }
}

createRoot(document.getElementById("root")).render(<Website />);
