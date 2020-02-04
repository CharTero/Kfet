let socket = io();
let WIP = document.getElementById("encours");
let done = document.getElementById("realisee");
let waiting = document.getElementById("attente");

function addcmd(id, plate, ingredient, sauce, drink, dessert, state, client, sandwich) {
    for (let i of ["plate", "ingredient", "sauce", "drink", "dessert", "state", "sandwich"])
        if (!eval(i))
            eval(`${i} = ""`);
    done.insertAdjacentHTML("beforeend", `<div id=cmd${id}> <h1>${id}</h1><h2>${sandwich}</h2><h3>${client}</h3><p>${plate} | ${ingredient}</p><p>${sauce}</p><p>${drink}</p><p>${dessert}</p> </div>`);
    let e = document.getElementById(`cmd${id}`);
    switch (state) {
        case "WIP":
            WIPed(e, sandwich);
            break;
        case "waiting":
            wait(e);
            break;
    }
}

function WIPed(e, name) {
    e.querySelector("h2").innerHTML = name;
    let names = [name];
    WIP.querySelectorAll("h2").forEach(e => {
        names.push(e.innerHTML)
    });
    names.sort();
    if (names.indexOf(name) === 0)
        WIP.insertAdjacentHTML("afterbegin", e.outerHTML);
    else {
        WIP.children[names.indexOf(name)-1].insertAdjacentHTML("afterend", e.outerHTML);
    }

    WIP.querySelector(`#${e.id}`).addEventListener("click", ev => {
        socket.emit("done command", {"id": parseInt(e.id.replace("cmd", ""))});
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
        addcmd(c.id, c.plate, c.ingredient, c.sauce, c.drink, c.dessert, c.state, c.client,c.sandwich);
    }
    waiter();
});

socket.on("list service", data => {
    if (Object.keys(data).length === 0)
        alert("No service set !");
    else
        socket.emit("list command");
});

socket.on("new command", data => {
    addcmd(data.id, data.plate, data.ingredient, data.sauce, data.drink, data.dessert, data.state, data.client, data.sandwich);
    waiter();
});

socket.on("cleared command", data => {
    wait(document.getElementById((`cmd${data.id}`)));
    waiter();
});

socket.on("WIPed command", data => {
    WIPed(document.getElementById((`cmd${data.id}`)), data.sandwich);
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
