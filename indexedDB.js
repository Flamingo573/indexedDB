(function() {
	window.indexedDB.deleteDatabase('dataBase')

	let IDBOpenRequest;
	let db;

	connectDB();

	function connectDB() {
		IDBOpenRequest = indexedDB.open('dataBase', 1);

		IDBOpenRequest.onupgradeneeded = (event) => {
			let db = IDBOpenRequest.result.createObjectStore('tables', {keyPath: 'id'});

			db.createIndex('time', 'time', { unique: false });
			db.createIndex('name', 'name', { unique: false });
			db.createIndex('table', 'table', { unique: false });
			console.log('Create DB');
		};

		IDBOpenRequest.onsuccess = (event) => {
			db = IDBOpenRequest.result;
			console.log('Success');
			startWork();
		};
		IDBOpenRequest.onerror = (event) => {console.log('Error')};
	}

	function startWork() {
		let addForm = new AddForm({
			db: db,
			form: document.body.querySelector('.terminal__form-add-client')
		});

		let searchForm = new SearchForm({
			db: db,
			form: document.body.querySelector('.terminal__form_search')
		});
	}

	class AddForm {
		constructor(options) {
			this.db = options.db;
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
			console.log(content);
			return content;
		}

		addContent() {
			let transaction = db.transaction(['tables'], 'readwrite'),
				objectStore = transaction.objectStore('tables'),
				content = this.createContent();
				console.log(objectStore );
			if (!content) {
				this.showHint('Empty field');
				return;
			}

			let request = objectStore.add(content);

			request.onsuccess = (event) => {
				console.log(event);
				this.clearField();
				this.showHint('Success');
			}

			request.onerror = (event) => {
				let code = event.target.error.code;

				if (code === 0) {
					this.showHint('Busy');
				}
			}
		}

		clearField() {
			this.fields.forEach( (item) => {
				item.value = ''
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


	class SearchForm {
		constructor(options) {
			this.db = options.db;
			this.form = options.form;
			this.fields = this.form.querySelectorAll('.terminal__field');
			this.button = this.form.querySelector('.terminal__button');
			this.result = this.form.querySelector('.terminal__result-content');
			this.clear = this.form.querySelector('.terminal__result-clear');
			this.showAll = this.form.querySelector('.terminal__result-show');
			this.popup = this.form.querySelector('.terminal__popup');

			this.button.addEventListener('click', this.handlerClick.bind(this));
			this.clear.addEventListener('click', this.clearContent.bind(this));
			this.showAll.addEventListener('click', this.allContent.bind(this));
			this.form.addEventListener('keypress', this.handlerKeypress.bind(this));

			this.stageFields()
		}

		handlerClick(event) {
			this.getContent();
		}

		handlerKeypress(event) {
			if (event.keyCode == 13) this.getContent();
		}

		stageFields() {
			let activeField,
				self = this;

			this.form.addEventListener('focus', handlerFocus.bind(this), true);
			this.form.addEventListener('blur', handlerBlur.bind(this), true);

			function handlerFocus(event) {
				activeField = event.target;

				if (activeField.classList.contains('terminal__field')) disableField();

				console.log(activeField);
			}

			function handlerBlur(event) {
				let field = event.target;

				if (!field.value) {
					enableField();
				}
				console.log(event.target);
			}

			function disableField() {
				self.fields.forEach( (field) => {
					if (field != activeField) {
						field.classList.add('terminal__field_disable');
					}
				});
			}

			function enableField() {
				self.fields.forEach( (field) => {

					field.classList.remove('terminal__field_disable');
				});
			}
		}

		createRequest() {
			let request = {};

			for (let i = 0; i < this.fields.length; i++) {
				if (this.fields[i].value) {
					let index = this.fields[i].name,
						value = this.fields[i].value;

					request[index] = value;

					// request.index = index;
					// request.value = value;
					//break;
				}
			}

			if ( !Object.keys(request).length ) {
				return false;
			}
			console.log(request);
			return request;
		}

		getContent() {
			let transaction = db.transaction(['tables'], 'readonly'),
				objectStore = transaction.objectStore('tables'),
				request = this.createRequest();

			if (!request) {
				this.showHint('Search request empty');
				return;
			}

			if (Object.keys(request).length > 1) {

			}

			if (Object.keys(request).length < 2) {
				let index = objectStore.index(request.index),
					range = IDBKeyRange.only(request.value),
					cursor = index.openCursor(range),
					notEmpty = false;
			}



			cursor.onsuccess = (event) => {
				let cursor = event.target.result;

				if (cursor) {
					notEmpty = true;
					this.renderContent(event.target.result.value);
					cursor.continue();
				}

				if (!notEmpty) this.showHint('Not found');
			}
			cursor.onerror = (event) => {
				console.log(event);
			}
		}

		allContent() {
			let transaction = db.transaction(['tables']),
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
			let result = `<div class="terminal__result-item">Time: ${content.time}, Name: ${content.name}, Table: ${content.table};</div>`;

			this.clear.classList.add('terminal__result-clear_enable');
			this.result.insertAdjacentHTML('beforeEnd', result);
		}

		clearContent() {
			this.result.innerHTML = '';
			this.clear.classList.remove('terminal__result-clear_enable');
		}

		showHint(text) {
			this.form.classList.add('terminal__form_success');
			this.popup.innerHTML = `<div class="terminal__popup-content">${text}</div>`;

			setTimeout(function() {
				this.form.classList.remove('terminal__form_success');
				this.popup.innerHTML = '';
			}.bind(this), 1000);
		}

		clearField() {
			this.fields.forEach( (item) => {
				item.value = '';
			});
		}
	}
})();
