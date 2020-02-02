let socket = io();

document.querySelectorAll("input[type='text']").forEach(e => {
    e.addEventListener("keyup", ev => {hinter(ev)})
});

document.querySelector("button").addEventListener("click", ev => {
    let users= {};
    document.querySelectorAll("input[type='text']").forEach(e=> {
        if (e.style.color)
            socket.emit("add user", {"username": e.value, "firstname": prompt(`Prénom pour ${e.value}`), "lastname": prompt(`Nom pour ${e.value}`), "password": prompt(`MDP pour ${e.value}`)});
        users[e.id] = e.value;
    });
    socket.emit("set service", users);
    window.close();
});

function hinter(ev) {
    let input = ev.target;
    let min_characters = 0;
    if (input.value.length < min_characters)
        return;
    socket.emit("list users");
}

socket.on("connect", data => {
    if (data === "ok") {
        socket.emit("list service");
    }
});

socket.on("list service", data => {
    for (let s in data) {
        document.getElementById(s).value = data[s]
    }
});

socket.on("list users", data => {
    let user_list = document.getElementById("user_list");
    user_list.innerHTML = "";
    for (let u of data["list"]) {
        user_list.insertAdjacentHTML("beforeend", `<option value="${u}">`);
    }

    document.querySelectorAll("input[type='text']").forEach(e => {
        if (data["list"].indexOf(e.value) === -1)
            e.style.color = "red";
        else {
            e.style.color = "";
        }
    });
});
