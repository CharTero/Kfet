let socket = io();
let plate = document.querySelector('#plat ul');
let ingredient = document.querySelector('#ingredient ul');
let sauce = document.querySelector('#sauce ul');
let drink = document.querySelector('#boisson ul');
let dessert = document.querySelector('#dessert ul');
let list = document.querySelector('.liste');
let current = {"plate": null, "content": [], "sauce": [], "drink": null, "dessert": null};
let radios = {"plate": null};


function addcmd(id, plate, content, sauce, drink, dessert, state) {
    $(list).append(`<div class='com' id='cmd${id}'> <h1>Commande ${id}</h1> <div class='spec'> <p>${plate}</p><p>${content}</p><p>${sauce}</p><p>${drink}</p><p>${dessert}</p><button class='annuler' onclick='annuler(${id})'>Annuler</button> </div><button class='donner' onclick='donner(${id})'>Donnée</button><button class='erreur' onclick='erreur(${id})'>Erreur</button> </div>`);
    let e = document.querySelector(`.liste #cmd${id}`);
    e.addEventListener( "click" ,env => {
        env.stopPropagation();
        e.classList.toggle("show-spec");
    });
    switch (state) {
        case "done":
            done(e);
            break;
        case "gave":
            give(e);
            break;
        case "error":
            error(e);
            break;
    }
    document.querySelector('#resume>h1').innerHTML = `Commande ${id+1}`;
}

function addplate(id, name) {
    $(plate).append(`<li><input type="radio" name="plat" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        if (e.checked) {
            let curr, name;
            if (e.id === radios["plate"]) {
                e.checked = false;
                radios["plate"] = null;
                curr = null;
                name = null;
            } else {
                radios["plate"] = e.id;
                curr = e.id;
                name = document.querySelector(`label[for=${e.id}]`).innerHTML;
            }
            current["plate"] = curr;
            document.querySelectorAll("#resume p")[0].innerHTML = name;
        }
    })
}

function addingredient(id, name) {
    $(ingredient).append(`<li><input type="checkbox" name="ingredient" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        if (e.checked)
            current["content"].push(e.id);
        else
            current["content"].splice(current["content"].indexOf(e.id), 1);
        let content = [];
        document.querySelectorAll("input[name=ingredient]").forEach( e => {
            if (e.checked)
                content.push(document.querySelector(`label[for=${e.id}]`).innerHTML)
        });
        document.querySelectorAll("#resume p")[1].innerHTML = content.join(" - ");
        document.querySelectorAll("input[name=ingredient]").forEach( e => {
            if (!e.checked)
                e.disabled = content.length === 3
        });
    })
}

function addsauce(id, name) {
    $(sauce).append(`<li><input type="checkbox" name="sauce" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        if (e.checked)
            current["sauce"].push(e.id);
        else
            current["sauce"].splice(current["sauce"].indexOf(e.id), 1);
        let content = [];
        document.querySelectorAll("input[name=sauce]").forEach( e => {
            if (e.checked)
                content.push(document.querySelector(`label[for=${e.id}]`).innerHTML)
        });
        document.querySelectorAll("#resume p")[2].innerHTML = content.join(" - ");
        document.querySelectorAll("input[name=sauce]").forEach( e => {
            if (!e.checked)
                e.disabled = content.length === 2
        });
    })
}

function adddrink(id, name) {
    $(drink).append(`<li><input type="radio" name="boisson" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        if (e.checked) {
            let curr, name;
            if (e.id === radios["plate"]) {
                e.checked = false;
                radios["plate"] = null;
                curr = null;
                name = null;
            } else {
                radios["plate"] = e.id;
                curr = e.id;
                name = document.querySelector(`label[for=${e.id}]`).innerHTML;
            }
            current["drink"] = curr;
            document.querySelectorAll("#resume p")[3].innerHTML = name;
        }
    })
}

function adddessert(id, name) {
    $(dessert).append(`<li><input type="radio" name="dessert" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        if (e.checked) {
            let curr, name;
            if (e.id === radios["plate"]) {
                e.checked = false;
                radios["plate"] = null;
                curr = null;
                name = null;
            } else {
                radios["plate"] = e.id;
                curr = e.id;
                name = document.querySelector(`label[for=${e.id}]`).innerHTML;
            }
            current["dessert"] = curr;
            document.querySelectorAll("#resume p")[4].innerHTML = name;
        }
    })
}

function clear(e) {
    e.classList.remove('finis');
    e.classList.remove('donnee');
    e.classList.remove('probleme');
    e.classList.remove('show-spec');
    list.prepend(e);
}

function done(e) {
    e.classList.remove('show-spec');
    e.classList.add('finis');
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

function donner(id) {
    socket.emit("give command", {"id": id});
}
function annuler(id) {
    socket.emit("clear command", {"id": id});
}
function erreur(id) {
    socket.emit("error command", {"id": id});
}

socket.on("connect", function (data) {
    if (data === "ok") {
        socket.emit("list plate");
        socket.emit("list ingredient");
        socket.emit("list sauce");
        socket.emit("list drink");
        socket.emit("list dessert");
        socket.emit("list command");
    }
});

socket.on("list command", function (data) {
    let child = list.lastElementChild;
    while (child) {
        list.removeChild(child);
        child = list.lastElementChild;
    }
    for (let c of data.list) {
        addcmd(c.id, c.plate, c.content, c.sauce, c.drink, c.dessert, c.state);
    }
});

socket.on("list plate", function (data) {
    let child = plate.lastElementChild;
    while (child) {
        plate.removeChild(child);
        child = plate.lastElementChild;
    }
    for (let p of data.list) {
        addplate(p.id, p.name);
    }
});

socket.on("list ingredient", function (data) {
    let child = ingredient.lastElementChild;
    while (child) {
        ingredient.removeChild(child);
        child = ingredient.lastElementChild;
    }
    for (let i of data.list) {
        addingredient(i.id, i.name);
    }
});

socket.on("list sauce", function (data) {
    let child = sauce.lastElementChild;
    while (child) {
        sauce.removeChild(child);
        child = sauce.lastElementChild;
    }
    for (let s of data.list) {
        addsauce(s.id, s.name);
    }
});

socket.on("list drink", function (data) {
    let child = drink.lastElementChild;
    while (child) {
        drink.removeChild(child);
        child = drink.lastElementChild;
    }
    for (let d of data.list) {
        adddrink(d.id, d.name);
    }
});

socket.on("list dessert", function (data) {
    let child = dessert.lastElementChild;
    while (child) {
        dessert.removeChild(child);
        child = dessert.lastElementChild;
    }
    for (let d of data.list) {
        adddessert(d.id, d.name);
    }
});

socket.on("new command", function (data) {
    addcmd(data.id, data.plate, data.content, data.sauce, data.drink, data.dessert, data.state);
});

socket.on("cleared command", function (data) {
    clear(document.querySelector(`.liste #cmd${data.id}`));
});

socket.on("finish command", function (data) {
    done(document.querySelector(`.liste #cmd${data.id}`));
});

socket.on("gave command", function (data) {
    give(document.querySelector(`.liste #cmd${data.id}`));
});

socket.on("glitched command", function (data) {
    error(document.querySelector(`.liste #cmd${data.id}`));
});

document.querySelector('.validation').addEventListener('click', ev => {
    ev.stopPropagation();
    current["pc"] = 1;
    current["sandwitch"] = 1;
    current["client"] = 1;

    socket.emit("add command", current);
    current = {"plate": null, "content": [], "sauce": [], "drink": null, "dessert": null};
    document.querySelectorAll("input").forEach( e => {
        e.checked = false
    });
    document.querySelectorAll("#resume p").forEach( e => {
        e.innerHTML = ""
    });
});
