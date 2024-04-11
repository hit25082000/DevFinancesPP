const db = firebase.firestore();

const Modal = {
    open() {
        document
            .querySelector('.modal-overlay')
            .classList
            .add('active')

    },
    close() {
        Form.clearFields()

        document
            .querySelector('.modal-overlay')
            .classList
            .remove('active')
    },

    editModal(index) {
        let transaction = Transaction.all[index]

        Form.setValues(transaction, index);

        document
            .querySelector('.modal-overlay')
            .classList
            .toggle('active')
    },

    relationModal(index) {
        let transaction = Transaction.all[index]

        Form.setValues(transaction, index);

        document
            .querySelector('.modal-overlay')
            .classList
            .toggle('active')
    }
}

const Month = {
    currentMonth: (new Date().getMonth() + 1 ),
    currentYear: new Date().getFullYear(),
    monthNames: [
        "Janeiro", 
        "Fevereiro", 
        "Março", 
        "Abril", 
        "Maio", 
        "Junho",
        "Julho",
        "Agosto", 
        "Setembro", 
        "Outubro", 
        "Novembro",
        "Dezembro"
    ],

    getCurrentDate(){
        return this.currentMonth.toString()  + '-' + this.currentYear.toString()
    },

    pastMonthTotal(){
        this.currentMonth = db.collection("financy").doc((date.getMonth() - 1).toString()).get()
    },

    previousMonth(){
        this.currentMonth--;
        App.init()
    },

    nextMonth(){
        this.currentMonth++;
        App.init()
    },

    today(){
    }
}

const Storage = {
    async get(){
        var storage = await db.collection("financy").doc(Month.getCurrentDate()).get()
        if(storage.exists)
            return storage.data().transactions;
        
        await this.setNextMonth()
    },

    async set(transactions){
        await db.collection("financy").doc(Month.getCurrentDate()).set({transactions})
    },   

    async setNextMonth(){
        Month.currentMonth--;
        var transactions = await  this.get();
        Month.currentMonth++;
        await db.collection("financy").doc(Month.getCurrentDate()).set({transactions})
        App.init()
    }   
}

const Transaction = {
    all: [],

    add(transaction) {
        Transaction.all.push(transaction)

        App.save().then(()=>{
            App.reload()
        })
    },

    remove(index) {
        Transaction.all.splice(index, 1)
        App.save().then(()=>{
            App.reload()
        })
    },

    addPendency(index) {
        var transaction = {
            description: Transaction.all[index].description + ' Walace',
            amount: Transaction.all[index].amount / 2,
            date: Utils.formatDate(new Date().toISOString().substring(0, 10)),
            period: 'temp',
            type: 'pendency',
            id: null
        }

        Transaction.all.splice(index + 1, 0, transaction);

        App.save().then(()=>{
            App.reload()
        })
    },

    reset(index) {
        Transaction.all[index].amount = 0;

        App.save().then(()=>{
            App.reload()
        })
    },

    commitPendency(index) {
        Transaction.all[index].type = 'income';

        App.save().then(()=>{
            App.reload()
        })
    },

    incomes() {
        let income = 0;
        Transaction.all.forEach(transaction => {
            if (transaction.type == 'income') {
                income += transaction.amount;
            }
        })
        return income;
    },

    expenses() {
        let expense = 0;
        Transaction.all.forEach(transaction => {
            if (transaction.type == 'expense') {
                expense += transaction.amount;
            }
        })
        return expense;
    },

    pendencies() {
        let pendency = 0;
        Transaction.all.forEach(transaction => {
            if (transaction.type == 'pendency') {
                pendency += transaction.amount;
            }
        })
        return pendency;
    },

    totalPendencies() {
        if (this.pendencies() == 0)
            return this.pendencies()

        return this.total() + this.pendencies()
    },

    total() {
        return Transaction.incomes() - Transaction.expenses();
    },

    editTransaction(transaction, index) {
        Transaction.all[index] = transaction

        App.save().then(()=>{
            App.reload()
        })
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),
    currentDate: document.querySelector("#current-date"),
    row: null,   

    addTransactions(transactions) {
        transactions.forEach( function (transaction, index){
            DOM.addTransaction(transaction,index);
       });
    },

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.draggable = true
        tr.ondragstart = (event) => row = event.target;
        tr.ondragover = (event) => DOM.DragOver(event);
        tr.ondragend = (event) => DOM.DragEnd(event);
        tr.oncontextmenu = (event) => DOM.MenuContext(event);
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.classList.add(`transaction`)
        tr.classList.add(`${transaction.type}`)
        tr.dataset.index = index

        DOM.transactionsContainer.appendChild(tr)
    },

    MenuContext(event) {
        var e = event;
        e.preventDefault();

        var id = e.target.parentNode.dataset.index || e.target.parentNode.parentNode.dataset.index;

        let menu = document.createElement("div")
        menu.id = "ctxmenu"
        document.onmouseup = () => ctxmenu.outerHTML = ''
        menu.innerHTML = `<div class="container-menu" style="top: ${e.pageY}px; left: ${e.pageX}px;">
        <!-- code here -->
        <div class="menu" >
          <ul class="menu-list">
            <li class="menu-item"><button class="menu-button" onmousedown="Modal.editModal(${id})"><i data-feather="edit-2"></i>Editar</button></li>
          </ul>
          <ul class="menu-list">
            <li class="menu-item"><button class="menu-button menu-button--black"><i data-feather="circle"></i>No status<i data-feather="chevron-right"></i></button>
            <ul class="menu-sub-list">
              <li class="menu-item"><button class="menu-button menu-button--orange"><i data-feather="square"></i>Needs review</button></li>
                      <li class="menu-item"><button class="menu-button menu-button--purple"><i data-feather="octagon"></i>In progress</button></li>
                      <li class="menu-item"><button class="menu-button menu-button--green"><i data-feather="triangle"></i>Approved</button></li>
                      <li class="menu-item"><button class="menu-button menu-button--black menu-button--checked"><i data-feather="circle"></i>No status<i data-feather="check"></i></button></li>
            </ul>
            </li>
             <li class="menu-item"><button class="menu-button" style="color: #dc9960;" onmousedown="Transaction.addPendency(${id})">Criar pendencia</button></li>
          </ul>
          <ul class="menu-list">
            <li class="menu-item"><button class="menu-button menu-button--delete" onmousedown="Transaction.remove(${id})"><i data-feather="trash-2"></i>Delete</button></li>
          </ul>
        </div>
      </div>`
        document.body.appendChild(menu)
    },

    DragOver(event) {
        var e = event;
        e.preventDefault();

        let children = Array.from(e.target.parentNode.parentNode.children);

        if (children.indexOf(e.target.parentNode) > children.indexOf(row))
            e.target.parentNode.after(row);
        else
            e.target.parentNode.before(row);
    },

    DragEnd(event) {
        var e = event;
        e.preventDefault();

        let children = Array.from(e.target.parentNode.children);

        var newArrIndex = [];

        children.forEach(e => {
            const newIndex = e.getAttribute("data-index")

            const memory = Transaction.all[newIndex];

            newArrIndex.push(memory);
        });

        Transaction.all = newArrIndex;
        App.save();
    },

    innerHTMLTransaction(transaction, index) {
        const CSSclass = transaction.type;

        const amount = Utils.formatCurrency(transaction.amount)

        var button;

        switch (transaction.period) {
            case 'temp':
                if (transaction.type == 'pendency') {
                    button = `<td>
                    <img onclick="Transaction.commitPendency(${index})" src="./assets/income.svg" alt="Efetuar pendencia">
                    </td>`
                } else {
                    button = `<td>
                    <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
                    </td>`
                }
                break;            
            case 'fixed':
                button = `<td>
                <img onclick="Transaction.reset(${index})" src="./assets/minus.svg" alt="Remover transação">
                </td>`
                break;
            default:
                break;
        }

        const html = `
                <td class="description">${transaction.description}</td>
                <td class="${CSSclass}"> <p style="cursor: pointer;" onclick="Modal.editModal(${index})" id="${index}">${amount}</p </td>
                <td class="date">${transaction.date}</td>
                ${button}`

        return html
    },

    updateBalance() {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())
        document
            .getElementById('pendenciaDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.pendencies())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())
        document
            .getElementById('totalPendenciesDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.totalPendencies())
    },

    updateDate(){
        this.currentDate.innerHTML = Utils.formatCurrentDate(Month.getCurrentDate());
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
    },

    orderTransactions(event){
        var desc = 1,asc = -1

        if(event.target.classList.value == 'desc'){
            document.querySelectorAll('.desc').forEach(e => e.classList.remove("desc")) 
            document.querySelectorAll('.asc').forEach(e => e.classList.remove("asc")) 
            desc = 1,asc = -1
            event.target.classList.add("asc");
        }       
        else if(event.target.classList.value == 'asc'){
            document.querySelectorAll('.desc').forEach(e => e.classList.remove("desc")) 
            document.querySelectorAll('.asc').forEach(e => e.classList.remove("asc")) 
            desc = -1,asc = 1
            event.target.classList.add("desc");
        }else{
            document.querySelectorAll('.desc').forEach(e => e.classList.remove("desc")) 
            document.querySelectorAll('.asc').forEach(e => e.classList.remove("asc")) 
            event.target.classList.add("desc");
        }

        switch(event.target.dataset.type){
            case "Date":  
                Transaction.all.sort((a, b) => Utils.unformatDate(a.date) < Utils.unformatDate(b.date) ? desc : asc);
                App.save().then(()=>{
                    App.reload();
                })
                break;
            case "Description":  
                Transaction.all.sort((a, b) => a.description > b.description ? desc : asc);
                App.save().then(()=>{
                    App.reload();
                })
                break;
            case "Amount":
                Transaction.all.sort((a,b) => a.amount < b.amount ? desc : asc);
                App.save().then(()=>{
                    App.reload();
                })
                break;
        }
    },

    filterTransactions(event){
        const filters = document.querySelectorAll('.checkbox-filter')

        filters.forEach((filter) => {
            if(filter.checked){
                document.querySelectorAll(`.${filter.id}`).forEach(x => x.classList.remove('hidden'))
            } 
            if(!filter.checked){
                var transactions = document.querySelectorAll(`.${filter.id}`)
                transactions.forEach(x => x.classList.add('hidden'))
        } 
        })
    }
}

const Utils = {
    formatAmount(value) {
        value = Number(value.replace(/\,\./g, "")) * 100

        value = Math.round(value * 100) / 100

        return value
    },

    formatDate(date) {
        const splittedDate = date.split("-")
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },

    unformatDate(date) {
        const splittedDate = date.split("/")
        return new Date(splittedDate[2], Number(splittedDate[1]) -  1, splittedDate[0])
    },

    formatCurrentDate(date) {
        var formatedDate = date.split('-');
        return Month.monthNames[Number(formatedDate[0]) - 1] + "/" + formatedDate[1];
    },

    formatPeriod(transactions) {
    },

    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : ""

        value = String(value).replace(/\D/g, "")

        value = Number(value) / 100

        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })

        return signal + value
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),
    period: document.querySelector('select#period'),
    type: document.querySelector('select#type'),
    id: null,

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value,
            period: Form.period.value,
            type: Form.type.value
        }
    },

    setValues(transaction, index) {
        var currentDate = new Date().toISOString().substring(0, 10);

        Form.description.value = transaction.description
        Form.amount.value = transaction.amount / 100,
            Form.date.value = currentDate,
            Form.period.value = transaction.period,
            Form.type.value = transaction.type,
            Form.id = index
    },

    validateFields() {
        const { description, amount, date, type, period } = Form.getValues()

        if (description.trim() === "" ||
            amount.trim() === "" ||
            type.trim() === "" ||
            period.trim() === "" ||
            date.trim() === "") {
            throw new Error("Por favor, preencha todos os campos")
        }
    },

    formatValues() {
        let { description, amount, date, type, period } = Form.getValues()

        amount = Utils.formatAmount(amount)

        date = Utils.formatDate(date)

        return {
            description,
            amount,
            date,
            type,
            period
        }
    },

    clearFields() {
        Form.description.value = ""
        Form.amount.value = ""
        Form.date.value = ""
        Form.type.value = ""
        Form.id = null
    },

    submit(event) {
        event.preventDefault()

        try {
            Form.validateFields()
            const transaction = Form.formatValues()
            if (Form.id == null)
                Transaction.add(transaction)
            else
                Transaction.editTransaction(transaction, Form.id)
            Form.clearFields()
            Modal.close()
        } catch (error) {
            alert(error.message)
        }
    }
}

const App = {
    async init() {
        DOM.clearTransactions()
        Transaction.all = await Storage.get()

        DOM.addTransactions(Transaction.all)

        DOM.updateBalance()
        DOM.updateDate()
    },

    reload() {
        DOM.clearTransactions()
        App.init()
    },

    async save(){
        await Storage.set(Transaction.all)
    }
}

App.init()
