let socket = io();
let service = [];
let WIP = document.getElementById("encours");
let done = document.getElementById("realisee");
let waiting = document.getElementById("attente");

function addcmd(id, plate, ingredient, sauce, drink, dessert, state, sandwitch) {
    done.insertAdjacentHTML("beforeend", `<div id=cmd${id}> <h1>${id}</h1><h2></h2><p>${plate} | ${ingredient}</p><p>${sauce}</p><p>${drink}</p><p>${dessert}</p> </div>`);
    let e = document.getElementById(`cmd${id}`);
    e.addEventListener('keyup', ev => {
        if(!['1', '2', '3'].includes(ev.key)) return;

        let nth=+ev.key;
        let elem=WIP.querySelector(`.commis${nth}`);
        let next=waiting.querySelector('div');

        if(!next) {

            elem.classList.add('realisee');
            done.appendChild(elem);

        } else {
            next.classList.add(`commis${nth}`);
            WIP.replaceChild(next, elem);

            next.classList.add('realisee');
            done.prepend(elem);
            elem.classList.remove(`commis${nth}`);
        }
    });
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
    for (let s of service) {
        if (s[1] === name) {
            e.querySelector("h2").innerHTML = name;
            break;
        }
    }
    WIP.insertAdjacentHTML("afterbegin", e.outerHTML);
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

socket.on("connect", data => {
    if (data === "ok") {
        socket.emit("list service");
        socket.emit("list command");
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
    if (!WIP.children.length) {
        waiting.children[0].innerHTML
        //TODO: Auto WIP command
    }
});

socket.on("list service", data => {
    service = data["list"]
    if (service.length === 0)
        alert("No service set !");
});

socket.on("new command", data => {
    addcmd(data.id, data.plate, data.ingredient, data.sauce, data.drink, data.dessert, data.state);
});

socket.on("cleared command", data => {
    wait(document.getElementById((`cmd${data.id}`)))
});

socket.on("WIPed command", data => {
    WIPed(document.getElementById((`cmd${data.id}`)), data.sandwitch)
});

socket.on("finish command", data => {
    finish(document.getElementById((`cmd${data.id}`)))
});

socket.on("gave command", data => {
    finish(document.getElementById((`cmd${data.id}`)))
});

socket.on("glitched command", data => {
    finish(document.getElementById(`cmd${data.id}`))
});
