const apiBase = 'http://localhost:4000/api';

async function fetchHoldings(){
    const res = await fetch(apiBase + '/holdings');
    return res.json();
}

async function fetchTotal(){
    const res = await fetch(apiBase + '/total');
    return res.json();
}

async function render(){
    const listBody = document.querySelector('#list tbody');
    listBody.innerHTML = '';
    const holdings = await fetchHoldings();
    holdings.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${h.id}</td>
      <td>${h.symbol}</td>
      <td>${Number(h.amount_usd).toFixed(2)}</td>
      <td>${new Date(h.created_at).toLocaleString()}</td>
      <td>
        <button data-action="delete" data-id="${h.id}">Избриши</button>
        <button data-action="update" data-id="${h.id}">Ажурирај</button>
      </td>
    `;
        listBody.appendChild(tr);
    });

    const total = await fetchTotal();

    const growthVal = parseFloat(total.growth);
    let growthColor = "gray";
    let arrow = "";
    if (growthVal > 0) { growthColor = "green"; arrow = "↑"; }
    else if (growthVal < 0) { growthColor = "red"; arrow = "↓"; }

    document.getElementById('total').innerHTML =
        `Вкупно USD: <b>${Number(total.total).toFixed(2)}</b> | Пораст: <b style="color:${growthColor}">${arrow} ${Number(total.growth).toFixed(2)}%</b>`;
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const symbol = document.getElementById('symbol').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    if(!symbol || isNaN(amount)) return alert('Пополни полиња');
    await fetch(apiBase + '/holdings', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ symbol, amount_usd: amount })
    });
    document.getElementById('symbol').value = '';
    document.getElementById('amount').value = '';
    await render();
});

document.querySelector('#list tbody').addEventListener('click', async (e) => {
    if(e.target.tagName === 'BUTTON'){
        const id = e.target.dataset.id;
        const action = e.target.dataset.action;
        if (action === "delete") {
            await fetch(apiBase + '/holdings/' + id, { method: 'DELETE' });
        } else if (action === "update") {
            const newAmount = prompt("Нова вредност во USD:");
            if (newAmount && !isNaN(parseFloat(newAmount))) {
                await fetch(apiBase + '/holdings/' + id, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ amount_usd: parseFloat(newAmount) })
                });
            }
        }
        await render();
    }
});

window.addEventListener('load', render);
