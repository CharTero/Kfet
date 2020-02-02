let socket = io();
let plate = document.querySelector("#plat ul");
let ingredient = document.querySelector("#ingredient ul");
let sauce = document.querySelector("#sauce ul");
let drink = document.querySelector("#boisson ul");
let dessert = document.querySelector("#dessert ul");
let list = document.querySelector(".liste");
let current = {"plate": null, "ingredient": [], "sauce": [], "drink": null, "dessert": null};
let radios = {"plate": null, "drink": null, "dessert": null};


function addcmd(id, plate, ingredient, sauce, drink, dessert, state) {
    list.insertAdjacentHTML("beforeend", `<div class="com" id="cmd${id}"> <button class="donner">Donnée</button> <h1>${id}</h1> <div class="spec"> <p>${plate}</p><p>${ingredient}</p><p>${sauce}</p><p>${drink}</p><p>${dessert}</p><button class="annuler">Annuler</button><button class="erreur">Erreur</button> </div> </div>`);
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
        document.querySelectorAll("input[name=ingredient],input[name=sauce]").forEach( el => {
            el.disabled = !e.checked;
            if (!e.checked)
                el.checked = false
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
    document.querySelectorAll("#resume p")[p].innerHTML = current[n].join(" - ");
}

function clear(e) {
    e.classList.remove("finis");
    e.classList.remove("donnee");
    e.classList.remove("probleme");
    e.classList.remove("show-spec");
    list.prepend(e);
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
        addcmd(c.id, c.plate, c.ingredient, c.sauce, c.drink, c.dessert, c.state);
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
    }
});

socket.on("new command", data => {
    addcmd(data.id, data.plate, data.ingredient, data.sauce, data.drink, data.dessert, data.state);
});

socket.on("cleared command", data => {
    clear(document.querySelector(`.liste #cmd${data.id}`))
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
    socket.emit("add command", current);
    current = {"plate": null, "ingredient": [], "sauce": [], "drink": null, "dessert": null};
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
