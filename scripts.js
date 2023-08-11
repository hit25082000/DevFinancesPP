const Modal = {
    open() {
        document
            .querySelector('.modal-overlay')
            .classList
            .add('active')

    },
    close() {
        document
            .querySelector('.modal-overlay')
            .classList
            .remove('active')
    },

    editModal(index) {

        transaction = Transaction.all[index]

        Form.setValues(transaction, index);

        document
            .querySelector('.modal-overlay')
            .classList
            .toggle('active')
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    },

    set(transactions) {
        localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions))
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction){
        Transaction.all.push(transaction)

        App.reload()
    },

    remove(index) {
        Transaction.all.splice(index, 1)

        App.reload()
    },

    commitPendencie(index) {
        Transaction.all[index].type = 'income';

        App.reload()
    },

    incomes() {
        let income = 0;
        Transaction.all.forEach(transaction => {
            if( transaction.type == 'income' ) {
                income += transaction.amount;
            }
        })
        return income;
    },

    expenses() {
        let expense = 0;
        Transaction.all.forEach(transaction => {
            if( transaction.type == 'expense' ) {
                expense += transaction.amount;
            }
        })
        return expense;
    },

    pendencies() {
        let pendencie = 0;
        Transaction.all.forEach(transaction => {
            if( transaction.type == 'pendencie' ) {
                pendencie += transaction.amount;
            }
        })
        return pendencie;
    },

    totalPendencies() {
        if(this.pendencies() == 0)
            return this.pendencies()
    
        return this.total() + this.pendencies()
    },

    total() {
        return Transaction.incomes() - Transaction.expenses();
    },

    editTransaction(transaction, index) {
        Transaction.all[index] = transaction

        App.reload();
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),
    row: null,

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.draggable = true
        tr.ondragstart = (event) => row = event.target;
        tr.ondragover = (event) => DOM.DragOver(event) 
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index

        DOM.transactionsContainer.appendChild(tr)
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

    innerHTMLTransaction(transaction, index) {
        const CSSclass = transaction.type;

        const amount = Utils.formatCurrency(transaction.amount)

        var button;

        switch (transaction.period) {
            case 'temp':
                if (transaction.type == 'pendencie') {
                    button = `<td>
                    <img onclick="Transaction.commitPendencie(${index})" src="./assets/income.svg" alt="Efetuar pendencia">
                    </td>`
                } else {
                    button = `<td>
                    <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
                    </td>`
                }
                break;
            case 'fixed':
                button = `<td>
                                
                         </td>`
                break;
            default:
                break;
        }

        const html = `
                <td class="description">${transaction.description}</td>
                <td class="${CSSclass}"> <p style="cursor: pointer;" onclick="Modal.editModal(${index})" id="inputAmount${index}">${amount}</p </td>
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

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
    }
}

const Utils = {
    formatAmount(value){
        
        value = Number(value.replace(/\,\./g, "")) * 100
        
        value = Math.round(value * 100) / 100
        
        return value
    },

    formatDate(date) {
        const splittedDate = date.split("-")
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
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
        
        if( description.trim() === "" || 
            amount.trim() === "" || 
            type.trim() === "" || 
            period.trim() === "" || 
            date.trim() === "" ) {
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
    init() {       
        Transaction.all.forEach(DOM.addTransaction)
        
        DOM.updateBalance()

        Storage.set(Transaction.all)
    },
    reload() {
        DOM.clearTransactions()
        App.init()
    },
}

App.init()
