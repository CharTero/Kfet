let socket = io();
let service = [];
let WIP = document.getElementById("encours");
let done = document.getElementById("realisee");
let waiting = document.getElementById("attente");

function addcmd(id, plate, ingredient, sauce, drink, dessert, state, sandwitch) {
    done.insertAdjacentHTML("beforeend", `<div id=cmd${id}> <h1>${id}</h1><h2></h2><p>${plate} | ${ingredient}</p><p>${sauce}</p><p>${drink}</p><p>${dessert}</p> </div>`);
    let e = document.getElementById(`cmd${id}`);
    switch (state) {
        case "WIP":
            WIPed(e, sandwitch);
            break;
        case "waiting":
            wait(e);
            break;
    }
}

function WIPed(e, name) {
    e.querySelector("h2").innerHTML = name;
    WIP.insertAdjacentHTML("afterbegin", e.outerHTML);
    WIP.querySelector(`#${e.id}`).addEventListener("click", ev => {
        socket.emit("done command", {"id": parseInt(e.id.replace("cmd", ""))});
        console.log("test");
    });
    e.remove();
}

function finish(e) {
    done.insertAdjacentHTML("afterbegin", e.outerHTML);
    e.remove();
}

function wait(e) {
    waiting.insertAdjacentHTML("afterbegin", e.outerHTML);
    e.remove();
}

function waiter() {
    if (WIP.children.length < 3) {
        let i, list;
        if (waiting.children.length < 3 - WIP.children.length)
            i = waiting.children.length;
        else
            i = 3 - WIP.children.length;
        for (i-=1; i >= 0; i--) {
            socket.emit("WIP command", {"id": waiting.children[i].querySelector("h1").innerHTML})
        }
    }
}

socket.on("connect", data => {
    if (data === "ok") {
        socket.emit("list service");
    }
});

socket.on("list command", data => {
    for (let e of [WIP, done, waiting]) {
        let child = e.lastElementChild;
        while (child) {
            e.removeChild(child);
            child = e.lastElementChild;
        }
    }
    for (let c of data.list) {
        addcmd(c.id, c.plate, c.ingredient, c.sauce, c.drink, c.dessert, c.state, c.sandwitch);
    }
    waiter();
});

socket.on("list service", data => {
    service = data["list"]
    if (service.length === 0)
        alert("No service set !");
    else
        socket.emit("list command");
});

socket.on("new command", data => {
    addcmd(data.id, data.plate, data.ingredient, data.sauce, data.drink, data.dessert, data.state);
    waiter();
});

socket.on("cleared command", data => {
    wait(document.getElementById((`cmd${data.id}`)));
    waiter();
});

socket.on("WIPed command", data => {
    WIPed(document.getElementById((`cmd${data.id}`)), data.sandwitch);
    waiter();
});

socket.on("finish command", data => {
    finish(document.getElementById((`cmd${data.id}`)));
    waiter();
});

socket.on("gave command", data => {
    finish(document.getElementById((`cmd${data.id}`)));
    waiter();
});

socket.on("glitched command", data => {
    finish(document.getElementById(`cmd${data.id}`));
    waiter();
});
