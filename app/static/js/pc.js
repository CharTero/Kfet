let socket = io();
let list = document.querySelector('.liste');

function addcmd(id, plate, content, drink, dessert, state) {
    let newDiv = document.createElement("div");
    newDiv.classList.add('com');
    newDiv.id = `cmd${id}`;
    $(list).append(newDiv);
    let numCom = document.createElement("h1");
    let subDiv = document.createElement("div");
    let p1 = document.createElement("p");
    let p2 = document.createElement("p");
    let p3 = document.createElement("p");
    let p4 = document.createElement("p");
    let btn1 = document.createElement("button");
    let btn2 = document.createElement("button");
    let btn3 = document.createElement("button");
    subDiv.classList.add('spec');
    btn1.classList.add('annuler');
    btn2.classList.add('donner');
    btn3.classList.add('erreur');
    numCom.innerHTML = `Commande ${id}`;
    p1.innerHTML = plate;
    p2.innerHTML = content;
    p3.innerHTML = drink;
    p4.innerHTML = dessert;
    btn1.innerHTML = "Annuler";
    btn2.innerHTML = "Donnée";
    btn3.innerHTML = "Erreur";
    newDiv.append(numCom);
    newDiv.append(subDiv);
    subDiv.append(p1);
    subDiv.append(p2);
    subDiv.append(p3);
    subDiv.append(p4);
    subDiv.append(btn1);
    newDiv.append(btn2);
    newDiv.append(btn3);
    document.querySelector('#resume>h1').innerHTML = `Commande ${id+1}`;
    newDiv.addEventListener('click', ev => {
        newDiv.classList.toggle('show-spec');
    });
    newDiv.querySelector('.donner').addEventListener('click', ev => {
        ev.stopPropagation();
        socket.emit("give command", {"id": id});
    });
    newDiv.querySelector('.annuler').addEventListener('click', ev => {
        ev.stopPropagation();
        socket.emit("clear command", {"id": id});
    });
    newDiv.querySelector('.erreur').addEventListener('click', ev => {
        ev.stopPropagation();
        socket.emit("error command", {"id": id});
    });
    switch (state) {
        case "gave":
            give(newDiv);
            break;
        case "error":
            error(newDiv);
            break;
    }
}

function clear(e) {
    e.classList.remove('donnee');
    e.classList.remove('probleme');
    e.classList.remove('show-spec');
    list.prepend(e);
}

function give(e) {
    e.classList.remove('show-spec');
    e.classList.add('donnee');
    list.appendChild(e);
}

function error(e) {
    e.classList.remove('show-spec');
    e.classList.add('probleme');
    list.appendChild(e);
}

socket.on("command list", function (data) {
    var child = list.lastElementChild;
    while (child) {
        list.removeChild(child);
        child = list.lastElementChild;
    }
    for (let c of data.list) {
        addcmd(c.id, c.plate, c.content, c.drink, c.dessert, c.state);
    }
});

socket.on("new command", function (data) {
    addcmd(data.id, data.plate, data.content, data.drink, data.dessert, data.state);
});

socket.on("cleared command", function (data) {
    clear(document.querySelector(`.liste #cmd${data.id}`));
});

socket.on("gave command", function (data) {
    give(document.querySelector(`.liste #cmd${data.id}`));
});

socket.on("glitched command", function (data) {
    error(document.querySelector(`.liste #cmd${data.id}`));
});

document.querySelector('#resume button').addEventListener('click', ev => {
    socket.emit("add command", {"plate": document.querySelector('#resume :nth-child(2)'), "content": "Jambon - Tomate - Brie", "drink": "Boisson surprise", "dessert": "Panini nutella"});
});