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
  const phaser = useRef(null);
  const ball = useRef(null);
  const game = useRef(null);
  const socket = useRef(null);
  
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
    socket.current = io("http://localhost:3001");
    socket.current.on("connect", () => {
      console.log("Connected to server");
    });
    socket.current.on("admin", () => {
      console.log("Received admin event");
      setIsAdmin(true);
    });
    socket.current.on("user", () => {
      console.log("Received user event");
      setIsAdmin(false);
    });
    const config = {
      type: Phaser.AUTO,
      width: 700,
      height: 500,
      parent: phaser.current,
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
    game.current = new Phaser.Game(config);
    function preload() {
      this.load.image("ball", "./ball.png");
      this.cameras.main.setBackgroundColor('#add8e6');
    }
    function create() {
      socket.current.emit(isAdmin ? "admin" : "user");
      ball.current = this.physics.add.sprite(350, 300, "ball");
      ball.current.setCollideWorldBounds(true);
      ball.current.setBounce(1);
      ball.current.setInteractive();
      ball.current.setScale(0.1);
      this.physics.world.setBoundsCollision(true, true, true, true);
      this.physics.add.collider(
        ball.current,
        null,
        handleCollision,
        null,
        this
      );
    }

    function handleCollision() { }

    function update() {
      if (ball.current) {
        socket.current.emit("ballPosition", {
          x: ball.current.x,
          y: ball.current.y,
        });
      }
    }
    return () => {
      game.current.destroy(true);
      socket.current.off("ballMoved");
      socket.current.disconnect();
    };
  }, [ballPosition, isAdmin]);
  useEffect(() => {
    socket.current.on("ballMoved", ({ x, y }) => {
      if (!isAdmin && ball.current) {
        const angle = Phaser.Math.Angle.Between(
          ball.current.x,
          ball.current.y,
          x,
          y
        );

        ball.current.setVelocity(
          Math.cos(angle) * 700,
          Math.sin(angle) * 700
        );

        const distance = Phaser.Math.Distance.Between(
          ball.current.x,
          ball.current.y,
          x,
          y
        );
        const duration = (distance / 700) * 1000;

        game.current.scene.scenes[0].tweens.add({
          targets: ball.current,
          x: x,
          y: y,
          duration: duration,
          ease: "Linear",
          onComplete: () => {
          },
        });
      }
    });
    socket.current.on("adminButtonClicked", (buttonName) => {
      setLastClickedButton(buttonName);
      setClickedButtons([...clickedButtons, buttonName]);
    });
  }, [isAdmin, clickedButtons]);
  const handleButtonClick = (x, y, buttonName) => {
    if (isAdmin) {
      socket.current.emit("ballMoved", { x, y });
      socket.current.emit("adminButtonClicked", buttonName);
      setLastClickedButton(buttonName);

    } else {
      socket.current.emit("userButtonClicked", { x, y });
      //      socket.current.emit("userButtonClicked", buttonName);
      setButtonDisabled(true);
    }

    if (ball.current && isAdmin) {
      const angle = Phaser.Math.Angle.Between(
        ball.current.x,
        ball.current.y,
        x,
        y
      );
      const speed = 800;
      ball.current.setVelocityX(Math.cos(angle) * speed);
      ball.current.setVelocityY(Math.sin(angle) * speed);
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
            <div ref={phaser} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
