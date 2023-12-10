import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import io from "socket.io-client";
import "./App.css";

const Button = ({ x, y, label, onClick, disabled }) => (
  <button
    onClick={() => onClick(x, y, label)}
    className={`button ${disabled ? "disabled" : ""}`}
    disabled={disabled}
    style={{ left: `${x}px`, top: `${y}px` }}
  >
    {label}
  </button>
);

const App = () => {
  const phaserRef = useRef(null);
  const ballRef = useRef(null);
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const [ballPosition] = useState({ x: 0, y: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [clickedButtons, setClickedButtons] = useState([]);
  const [lastClickedButton, setLastClickedButton] = useState(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const canvasStyle = {
    width: "50%",
    height: "70%",
    margin: "auto",
    position: "relative",
  };

  useEffect(() => {
    socketRef.current = io("http://localhost:4000");
    socketRef.current.on("connect", () => {
      console.log("Connected to server");
    });
    socketRef.current.on("admin", () => {
      console.log("Received admin event");
      setIsAdmin(true);
    });

    socketRef.current.on("viewer", () => {
      console.log("Received user event");
      setIsAdmin(false);
    });
    const config = {
      type: Phaser.AUTO,
      width: 700,
      height: 500,
      parent: phaserRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    gameRef.current = new Phaser.Game(config);

    function preload() {
      this.load.image("ball", "./ball.png");
      this.cameras.main.setBackgroundColor('#add8e6');
    }


    function create() {
      socketRef.current.emit(isAdmin ? "admin" : "viewer");

      ballRef.current = this.physics.add.sprite(350, 300, "ball");
      ballRef.current.setCollideWorldBounds(true);
      ballRef.current.setBounce(1);
      ballRef.current.setInteractive();
      ballRef.current.setScale(0.1);

      this.physics.world.setBoundsCollision(true, true, true, true);

      this.physics.add.collider(
        ballRef.current,
        null,
        handleCollision,
        null,
        this
      );
    }

    function handleCollision() { }

    function update() {
      if (ballRef.current) {
        socketRef.current.emit("ballPosition", {
          x: ballRef.current.x,
          y: ballRef.current.y,
        });
      }
    }
    return () => {
      gameRef.current.destroy(true);
      socketRef.current.off("ballMoved");
      socketRef.current.disconnect();
    };
  }, [ballPosition, isAdmin]);
  useEffect(() => {
    socketRef.current.on("ballMoved", ({ x, y }) => {
      if (!isAdmin && ballRef.current) {
        const angle = Phaser.Math.Angle.Between(
          ballRef.current.x,
          ballRef.current.y,
          x,
          y
        );

        ballRef.current.setVelocity(
          Math.cos(angle) * 700,
          Math.sin(angle) * 700
        );

        const distance = Phaser.Math.Distance.Between(
          ballRef.current.x,
          ballRef.current.y,
          x,
          y
        );
        const duration = (distance / 700) * 1000;

        gameRef.current.scene.scenes[0].tweens.add({
          targets: ballRef.current,
          x: x,
          y: y,
          duration: duration,
          ease: "Linear",
          onComplete: () => {
          },
        });
      }
    });
    socketRef.current.on("adminButtonClicked", (buttonName) => {
      setLastClickedButton(buttonName);
      setClickedButtons([...clickedButtons, buttonName]);
    });
  }, [isAdmin, clickedButtons]);
  const handleButtonClick = (x, y, buttonName) => {
    if (isAdmin) {
      socketRef.current.emit("ballMoved", { x, y });
      socketRef.current.emit("adminButtonClicked", buttonName);
      setLastClickedButton(buttonName);

    } else {
      socketRef.current.emit("viewerButtonClicked", { x, y });
      //      socketRef.current.emit("viewerButtonClicked", buttonName);
      setButtonDisabled(true);
    }

    if (ballRef.current && isAdmin) {
      const angle = Phaser.Math.Angle.Between(
        ballRef.current.x,
        ballRef.current.y,
        x,
        y
      );
      const speed = 800;
      ballRef.current.setVelocityX(Math.cos(angle) * speed);
      ballRef.current.setVelocityY(Math.sin(angle) * speed);
    }
    setClickedButtons([...clickedButtons, buttonName]);
  };

  return (
    <div>
      <div id="right-panel">
        <h2 className="text-lg font-extrabold">
          {isAdmin ? (
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <p className="text-center justify-center items-center">ADMIN</p>
            </div>
          ) : (
            <div className="flex" style={{ textAlign: 'center', marginBottom: '10px' }}>
              <p className="text-lg ml-96 font-extrabold">USER</p>
              {clickedButtons.length > 0 && (
                <h6><i>
                  <p className="ml-96 text-lg font-extrabold">
                    Buttons clicked by admin: {clickedButtons.join(", ")}
                  </p>
                </i></h6>
              )}</div>
          )}
        </h2>
      </div>
      <div className="flex justify-center mt-4">
        <div style={canvasStyle} className="relative">
          <Button x={0} y={120} label="Button 1" onClick={handleButtonClick} disabled={buttonDisabled} />
          <Button x={0} y={360} label="Button 2" onClick={handleButtonClick} disabled={buttonDisabled} />
          <Button x={150} y={465} label="Button 3" onClick={handleButtonClick} disabled={buttonDisabled} />
          <Button x={410} y={465} label="Button 4" onClick={handleButtonClick} disabled={buttonDisabled} />
          <Button x={620} y={360} label="Button 5" onClick={handleButtonClick} disabled={buttonDisabled} />
          <Button x={620} y={120} label="Button 6" onClick={handleButtonClick} disabled={buttonDisabled} />
          <Button x={150} y={0} label="Button 7" onClick={handleButtonClick} disabled={buttonDisabled} />
          <Button x={400} y={0} label="Button 8" onClick={handleButtonClick} disabled={buttonDisabled} />

          <div className="w-9/12 h-9/12">
            {/* Canvas container */}
            <div ref={phaserRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
