let socket = io();
let plate = document.querySelector("#plat ul");
let ingredient = document.querySelector("#ingredient ul");
let sauce = document.querySelector("#sauce ul");
let drink = document.querySelector("#boisson ul");
let dessert = document.querySelector("#dessert ul");
let list = document.querySelector(".liste");
let current = {"plate": null, "ingredient": [], "sauce": [], "drink": null, "dessert": null, "price": {}};
let radios = {"plate": null, "drink": null, "dessert": null};
let db = {"plate": {}, "ingredient": {}, "sauce": {}, "drink": {}, "dessert": {}};


function addcmd(id, plate, ingredient, sauce, drink, dessert, state, client, sandwich) {
    for (let i of ["plate", "ingredient", "sauce", "drink", "dessert", "state", "sandwich"])
        if (!eval(i))
            eval(`${i} = ""`);
    list.insertAdjacentHTML("beforeend", `<div class="com" id="cmd${id}"> <button class="donner">Donnée</button> <h1>${id}</h1> <div class="spec"> <h2>${sandwich}</h2><h3>${client}</h3><p>${plate}</p><p>${ingredient}</p><p>${sauce}</p><p>${drink}</p><p>${dessert}</p><button class="annuler">Annuler</button><button class="erreur">Erreur</button> </div> </div>`);
    let e = document.querySelector(`.liste #cmd${id}`);
    e.addEventListener( "click" ,ev => {
        ev.stopPropagation();
        e.classList.toggle("show-spec");
    });
    e.querySelector(".donner").addEventListener("click", ev => {
        ev.stopPropagation();
        socket.emit("give command", {"id": id});
    });
    e.querySelector(".annuler").addEventListener("click", ev => {
        ev.stopPropagation();
        socket.emit("clear command", {"id": id});
    });
    e.querySelector(".erreur").addEventListener("click", ev => {
        ev.stopPropagation();
        socket.emit("error command", {"id": id});
    });
    switch (state) {
        case "WIP":
            WIP(e, sandwich);
            break;
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
    document.querySelector("#resume>h1").innerHTML = `Commande ${id+1}`;
}

function addplate(id, name) {
    plate.insertAdjacentHTML("beforeend", `<li><input type="radio" name="plate" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        radiocheck(e,  "plate",0);
        document.querySelectorAll("input[name=ingredient]").forEach( el => {
            if (e.checked && !db["plate"][e.id]["avoid ingredient"])
                el.disabled = false;
            else {
                el.disabled = true;
                el.checked = false
            }
        });
        document.querySelectorAll("input[name=sauce]").forEach( el => {
            if (e.checked && !db["plate"][e.id]["avoid sauce"])
                el.disabled = false;
            else {
                el.disabled = true;
                el.checked = false
            }
        });
    })
}

function addingredient(id, name) {
    ingredient.insertAdjacentHTML("beforeend", `<li><input type="checkbox" disabled=true name="ingredient" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        checkcheck(e, "ingredient", 1, 3)
    })
}

function addsauce(id, name) {
    sauce.insertAdjacentHTML("beforeend", `<li><input type="checkbox" disabled=true name="sauce" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        checkcheck(e, "sauce", 2, 2)
    })
}

function adddrink(id, name) {
    drink.insertAdjacentHTML("beforeend", `<li><input type="radio" name="drink" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        radiocheck(e, "drink", 3)
    })
}

function adddessert(id, name) {
    dessert.insertAdjacentHTML("beforeend", `<li><input type="radio" name="dessert" id="${id}"><label for="${id}">${name}</label></li>`);
    let e = document.querySelector(`input[id=${id} ]`);
    e.addEventListener("click", () => {
        radiocheck(e, "dessert", 4)
    })
}

function radiocheck (e, n, p) {
    if (e.checked) {
        let curr, name;
        if (e.id === radios[n]) {
            e.checked = false;
            radios[n] = null;
            curr = null;
            name = null;
        } else {
            radios[n] = e.id;
            curr = e.id;
            name = document.querySelector(`label[for=${e.id}]`).innerHTML;
        }
        current[n] = curr;
        if (curr)
            current["price"][n] = db[n][curr]["price"];
        else
            current["price"][n] = 0;
        price();
        document.querySelectorAll("#resume p")[p].innerHTML = name;
    }
}

function checkcheck(e, n, p, l) {
    if (e.checked)
        current[n].push(e.id);
    else
        current[n].splice(current[n].indexOf(e.id), 1);
    document.querySelectorAll(`input[name=${n}]`).forEach( e => {
        if (!e.checked)
            e.disabled = current[n].length === l
    });
    current["price"][n] = 0;
    for (let i of current[n]) {
        current["price"][n] += db[n][i]["price"]
    }
    price();
    document.querySelectorAll("#resume p")[p].innerHTML = current[n].join(" - ");
}

function clear(e) {
    e.classList.remove("finis");
    e.classList.remove("donnee");
    e.classList.remove("probleme");
    e.classList.remove("WIP");
    e.classList.remove("show-spec");
    list.prepend(e);
}

function WIP(e, name) {
    e.classList.remove("show-spec");
    e.classList.add("WIP");
    e.querySelector("h2").innerHTML = name;
}

function done(e) {
    e.classList.remove("show-spec");
    e.classList.add("finis");
}

function give(e) {
    e.classList.remove("show-spec");
    e.classList.add("donnee");
    list.appendChild(e);
}

function error(e) {
    e.classList.remove("show-spec");
    e.classList.add("probleme");
    list.appendChild(e);
}

function price () {
    let p = 0;
    for (let i in current["price"]) {
        p += current["price"][i]
    }
    document.querySelector("#resume h2").innerHTML = p+"€";
}

socket.on("connect", data => {
    if (data === "ok") {
        socket.emit("list plate");
        socket.emit("list ingredient");
        socket.emit("list sauce");
        socket.emit("list drink");
        socket.emit("list dessert");
        socket.emit("list command");
    }
});

socket.on("list command", data => {
    let child = list.lastElementChild;
    while (child) {
        list.removeChild(child);
        child = list.lastElementChild;
    }
    for (let c of data.list) {
        addcmd(c.id, c.plate, c.ingredient, c.sauce, c.drink, c.dessert, c.state, c.client, c.sandwich);
    }
});

socket.on("list plate", data => {
    let child = plate.lastElementChild;
    while (child) {
        plate.removeChild(child);
        child = plate.lastElementChild;
    }
    for (let p of data.list) {
        addplate(p.id, p.name);
        db["plate"][p.id] = {"name": p.name, "price": p.price, "avoid ingredient": p.avoid_ingredient, "avoid sauce": p.avoid_sauce}
    }
});

socket.on("list ingredient", data => {
    let child = ingredient.lastElementChild;
    while (child) {
        ingredient.removeChild(child);
        child = ingredient.lastElementChild;
    }
    for (let i of data.list) {
        addingredient(i.id, i.name);
        db["ingredient"][i.id] = {"name": i.name, "price": i.price}
    }
});

socket.on("list sauce", data => {
    let child = sauce.lastElementChild;
    while (child) {
        sauce.removeChild(child);
        child = sauce.lastElementChild;
    }
    for (let s of data.list) {
        addsauce(s.id, s.name);
        db["sauce"][s.id] = {"name": s.name, "price": s.price}
    }
});

socket.on("list drink", data => {
    let child = drink.lastElementChild;
    while (child) {
        drink.removeChild(child);
        child = drink.lastElementChild;
    }
    for (let d of data.list) {
        adddrink(d.id, d.name);
        db["drink"][d.id] = {"name": d.name, "price": d.price}
    }
});

socket.on("list dessert", data => {
    let child = dessert.lastElementChild;
    while (child) {
        dessert.removeChild(child);
        child = dessert.lastElementChild;
    }
    for (let d of data.list) {
        adddessert(d.id, d.name);
        db["dessert"][d.id] = {"name": d.name, "price": d.price}
    }
});

socket.on("new command", data => {
    addcmd(data.id, data.plate, data.ingredient, data.sauce, data.drink, data.dessert, data.state, data.client, data.sandwich);
});

socket.on("cleared command", data => {
    clear(document.querySelector(`.liste #cmd${data.id}`))
});

socket.on("WIPed command", data => {
    WIP(document.querySelector(`.liste #cmd${data.id}`), data.sandwich)
});

socket.on("finish command", data => {
    done(document.querySelector(`.liste #cmd${data.id}`))
});

socket.on("gave command", data => {
    give(document.querySelector(`.liste #cmd${data.id}`))
});

socket.on("glitched command", data => {
    error(document.querySelector(`.liste #cmd${data.id}`))
});

document.querySelector(".validation").addEventListener("click", ev => {
    ev.stopPropagation();
    let user = document.getElementById("user");
    if (!current.plate && !current.ingredient.length && !current.sauce.length && !current.drink && !current.dessert) {
        alert("Empty command !");
        return;
    } else if (user.style.color === "red") {
        current["firstname"] = prompt("Prénom");
        current["lastname"] = prompt("Nom");
    }

    current["client"] = user.value;
    current["pc"] = pc_id;
    socket.emit("add command", current);
    current = {"plate": null, "ingredient": [], "sauce": [], "drink": null, "dessert": null, "price": {}};
    document.querySelectorAll("input[name=plate],input[name=drink],input[name=dessert]").forEach( e => {
        e.checked = false;
    });
    document.querySelectorAll("input[name=ingredient],input[name=sauce]").forEach( e => {
        e.checked = false;
        e.disabled = true;
    });
    document.querySelectorAll("#resume p").forEach( e => {
        e.innerHTML = ""
    });
    user.value = "";
    user.style.color = "";
    document.getElementById("user_list").innerHTML = "";
});

document.getElementById("user").addEventListener("keyup", ev => {hinter(ev)});

function hinter(ev) {
    let input = ev.target;
    let min_characters = 0;
    if (input.value.length < min_characters)
        return;
    socket.emit("list users", {"user": input.value});
}

socket.on("list users", data => {
    let user_list = document.getElementById("user_list");
    user_list.innerHTML = "";
    for (let u of data["list"]) {
        user_list.insertAdjacentHTML("beforeend", `<option value="${u}">`);
    }

    let user = document.getElementById("user");
    if (data["list"].indexOf(user.value) === -1)
        user.style.color = "red";
    else {
        user.style.color = "";
    }
});
