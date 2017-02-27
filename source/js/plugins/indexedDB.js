"use strict";

class ConnectDB {
	constructor(options) {
		this.funcStart = options.funcStart;
		this.db;
		this.createDB();
	}

	createDB() {
		let IDBOpenRequest = indexedDB.open('dataBase', 1);

		IDBOpenRequest.onupgradeneeded = (event) => {
			let db = IDBOpenRequest.result.createObjectStore('tables', {keyPath: 'id'});

			obj.forEach((item) => {
				db.add(item)
			})

			console.log('New DB');
			db.createIndex('time', 'time', { unique: false });
			db.createIndex('name', 'name', { unique: false });
			db.createIndex('table', 'table', { unique: false });
		};

		IDBOpenRequest.onsuccess = (event) => {
			this.db = IDBOpenRequest.result;
			this.funcStart();
			console.log('Success');
		};
		IDBOpenRequest.onerror = (event) => {alert('Error DB')};
	}

	getAccess(objSrore, type) {
		let transaction = this.db.transaction([objSrore], type);
		return transaction.objectStore(objSrore);
	}

	reset() {
		window.indexedDB.deleteDatabase('dataBase');
		this.createDB();
		location.reload();
	}
}

function startWork() {
	let addForm = new AddForm({
		form: document.body.querySelector('.terminal__form-add-client')
	});

	let controlForm = new ControlForm({
		form: document.body.querySelector('.terminal__form_control')
	});
}

let connectDB = new ConnectDB({
	funcStart: startWork
});

class AddForm {
	constructor(options) {
		this.form = options.form;
		this.fields = this.form.querySelectorAll('.terminal__field');
		this.button = this.form.querySelector('.terminal__button');
		this.popup = this.form.querySelector('.terminal__popup');

		this.button.addEventListener('click', this.handlerClick.bind(this));
		this.form.addEventListener('keypress', this.handlerKeypress.bind(this));
	}

	handlerClick(event) {
		this.addContent();
	}

	handlerKeypress(event) {
		if (event.keyCode == 13) this.addContent();
	}

	createContent(event) {
		let content = {};

		for (let i = 0; i < this.fields.length; i++) {
			let key = this.fields[i].name,
				value = this.fields[i].value;

			if (!value) {
				return false;
			}
			content[key] = value;
		}

		content.id = (content.time + '' + content.table).replace(/\./, '');
		return content;
	}

	addContent() {
		let content = this.createContent();

		if (!content) {
			this.showHint('Empty field');
			return;
		}

		let objectStore = connectDB.getAccess('tables', 'readwrite'),
			request = objectStore.add(content);

		request.onsuccess = (event) => {
			this.clearField();
			this.showHint('Success');
		}
		request.onerror = (event) => {
			let code = event.target.error.code || event.target.error.name;
			console.log(event);
			if (code === 0|| 'ConstraintError') {
				this.showHint('Busy');
			}
		}
	}

	clearField() {
		this.fields.forEach( (item) => {
			item.value = '';
		})
	}

	showHint(text) {
		this.form.classList.add('terminal__form_success');
		this.popup.innerHTML = `<div class="terminal__popup-content">${text}</div>`;

		setTimeout(function() {
			this.form.classList.remove('terminal__form_success');
			this.popup.innerHTML = '';
		}.bind(this), 1000);
	}
}

class ControlForm {
	constructor(options) {
		this.form = options.form;
		this.fields = this.form.querySelectorAll('.terminal__field');
		this.button = this.form.querySelector('.terminal__button');
		this.result = this.form.querySelector('.terminal__control-content');
		this.delDB = this.form.querySelector('.terminal__del_db');
		this.delItem = this.form.querySelector('.terminal__del_item');
		this.clear = this.form.querySelector('.terminal__clear');
		this.showAll = this.form.querySelector('.terminal__show');
		this.popup = this.form.querySelector('.terminal__popup');
		this.dangerPopup = this.form.querySelector('.terminal__popup-danger'),
		this.self = this;


		this.button.addEventListener('click', this.handlerClick.bind(this));
		this.clear.addEventListener('click', this.clearContent.bind(this));
		this.showAll.addEventListener('click', this.allContent.bind(this));
		this.form.addEventListener('keypress', this.handlerKeypress.bind(this));
		this.delDB.addEventListener('click', this.removeDB.bind(this));

		this.controlItem();
	}

	handlerClick(event) {
		this.getContent();
	}

	handlerKeypress(event) {
		if (event.keyCode == 13) this.getContent();
	}

	removeItem(id) {
		let objectStore = connectDB.getAccess('tables', 'readwrite'),
			request = objectStore.delete(id);

		request.addEventListener('success', (event) => {
			this.showHint('Delete');
		});
		request.addEventListener('error', (event) => {
			console.log('err');
		});
	}

	controlItem(event) {
		let activeItem,
			delItem = this.delItem,
			selectedClass = 'terminal__control-item_selected',
			disableClass = 'terminal__del_disable';

		this.form.addEventListener('click', handerClick.bind(this));

		function handerClick(event) {
			let target = event.target;

			if (target.classList.contains('terminal__control-item')) {
				activeItem = target;
				controlSelect(false)
				controlSelect(true)
				controlButton(true);
				return;
			}

			if (target == delItem) {
				if (!activeItem) return;
				let id = activeItem.dataset.id;

				this.popupDanger('Delete item?', () => {this.removeItem(id); activeItem.remove(); this.clearContent()});
				return;
			}
			else {
				controlSelect(false);
				controlButton(false);
			}
		}

		function controlButton(action) {
			if (action) delItem.classList.remove(disableClass);
			else delItem.classList.add(disableClass);
		}

		function controlSelect(action) {
			if (action) activeItem.classList.add(selectedClass);
			else {
				let items = document.body.querySelectorAll('.terminal__control-item');

				items.forEach((elem) => {
					elem.classList.remove(selectedClass);
				});
			}
		}
	}

	removeDB() {
		this.popupDanger('Delete the DB?', () => {connectDB.reset.call(connectDB)});
	}

	createRequest() {
		let request = {};

		for (let i = 0; i < this.fields.length; i++) {
			if (this.fields[i].value) {
				let index = this.fields[i].name,
					value = this.fields[i].value;

				request.index = index;
				request.value = value;
				break;
			}
		}

		if ( !Object.keys(request).length ) {
			return false;
		}
		return request;
	}

	getContent() {
		let request = this.createRequest();

		if (!request) {
			this.showHint('Search request empty');
			return;
		}

		let objectStore = connectDB.getAccess('tables', 'readonly'),
			index = objectStore.index(request.index),
			range = IDBKeyRange.only(request.value),
			cursor = index.openCursor(range),
			notEmpty = false;

		cursor.onsuccess = (event) => {
			let cursor = event.target.result;

			if (cursor) {
				notEmpty = true;
				this.renderContent(event.target.result.value);
				cursor.continue();
			}

			if (!notEmpty) {
				this.showHint('Not found');
				return;
			}

			this.clearField();
		}
		cursor.onerror = (event) => {
			console.log(event);
		}
	}

	allContent() {
		let transaction = connectDB.db.transaction(['tables']),
			objectStore = transaction.objectStore('tables'),
			index = objectStore.index('table'),
			cursor = index.openCursor();

		this.result.innerHTML = '';

		cursor.onsuccess = (event) => {
			let cursor = event.target.result,
				content;

			if (!cursor) return;
			content = cursor.value;

			this.renderContent(content);
			cursor.continue();
		}
	}

	renderContent(content) {
		let result = `<div class="terminal__control-item" data-id="${content.id}">Time: ${content.time}, Name: ${content.name}, Table: ${content.table};</div>`;

		this.clear.classList.add('terminal__clear_enable');
		this.result.insertAdjacentHTML('beforeEnd', result);
	}

	clearContent(event) {
		let clear = () => {
			this.result.innerHTML = '';
			this.clear.classList.remove('terminal__clear_enable');
		}

		if (event) clear();
		if (!this.result.children.length) clear();
	}

	showHint(text) {
		this.form.classList.add('terminal__form_success');
		this.popup.innerHTML = `<div class="terminal__popup-content">${text}</div>`;

		setTimeout(() => {
			this.form.classList.remove('terminal__form_success');
			this.popup.innerHTML = '';
		}, 1000);
	}

	popupDanger(text, func) {
		let formClass = 'terminal__form_del-db',
			buttonClass = 'terminal__popup-button',
			buttonDelClass = 'terminal__popup-button_del',
			titlePopup = document.body.querySelector('.terminal__popup-del-title');

		let controlClass = (action, cls) => {
			if (action) this.form.classList.add(cls);
			else this.form.classList.remove(cls);
		};

		let controlEvent = (action) => {
			if (action) this.dangerPopup.addEventListener('click', handlerClick);
			else this.dangerPopup.removeEventListener('click', handlerClick);
		}

		let handlerClick = (event) => {
			let target = event.target;
			if ( target.classList.contains(buttonClass) ) {
				if ( target.classList.contains(buttonDelClass) ) {
					func();
					controlClass(false, formClass);
					controlEvent(false);
				}
				else {
					controlClass(false, formClass);
					controlEvent(false);
				}
			}
		}

		titlePopup.innerHTML = text;
		controlClass(true, formClass);
		controlEvent(true);
	}

	clearField() {
		this.fields.forEach( (item) => {
			item.value = '';
		});
	}
}

let obj = [
	{
		time: '12.00',
		name: 'Max',
		table: '1',
		id: '12001'
	},
	{
		time: '11.00',
		name: 'Den',
		table: '1',
		id: '11001'
	},
	{
		time: '9.00',
		name: 'Mary',
		table: '3',
		id: '9003'
	},
	{
		time: '19.30',
		name: 'Ben',
		table: '19',
		id: '193019'
	},
	{
		time: '16.15',
		name: 'Nik',
		table: '7',
		id: '16157'
	},
	{
		time: '13.00',
		name: 'Tom',
		table: '3',
		id: '13003'
	}
]
