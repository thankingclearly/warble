{

	let

		objectTypes = ['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object', 'Error', 'Symbol'],

		typesReference = {};

	for (let index = 0, size = objectTypes.length; index < size; index++)

		typesReference[`[object ${objectTypes[index]}]`] = objectTypes[index].toLowerCase();

	class WarbleCore {

		constructor() {

			this.hooks = {
				is: {
					emptyObject(object) {

						for (let index in object)

							return false;

						return true;

					},
					// https://www.w3.org/TR/html5/forms.html#e-mail-state-(type=email)
					email: (value) => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value),
					numeric: (value) => /^\-?\d+(?:\.\d+)?$/.test(value),
					integer: (value) => /^\-?\d+$/.test(value),
					positive: (value) => /^\d+(?:\.\d+)?$/.test(value),
					negative: (value) => /^\-\d+(?:\.\d+)?$/.test(value),
					even: (value) => (Number(value) % 2) === 0,
					odd: (value) => (Number(value) % 2) > 0
				},
				validate: {
					required: (value, isRequired) => isRequired ? value !== undefined : true,
					pattern: (value, pattern) => (typeof pattern === 'object' && typeof pattern.test === 'function' ? pattern : new RegExp(pattern)).test(value),
					min: (value, min = 0) => (Number(value) || 0) >= (Number(min) || 0),
					max: (value, max = Infinity) => (Number(value) || 0) <= (Number(max) || 0),
					minlength: (value, min = 0) => typeof value === 'string' ? value.length >= (Number(min) || 0) : false,
					maxlength: (value, max = Infinity) => typeof value === 'string' ? value.length <= (Number(max) || 0) : false,
					type: (value, type) => core.type(value) === type,
					is(value, types) {

						var response = [];

						if (core.is(types, 'array')) {

							for (let index = 0, size = types.length; index < size; index++)

								if (!core.is(value, types[index]))

									response.push(types[index]);

						} else if (!core.is(value, types))

							response.push(types);

						return response.length > 0 ? response : true;

					},
					range: (value, range) => (core.is(range, 'array') && range.length > 1) ? Number(value) >= Number(range[0]) && Number(value) <= Number(range[1]) : false,
					equal(value, to)  {

						return typeof this === 'object' && this.hasOwnProperty(to) ? value === this[to] : false;

					}
				}
			};

		}

		type(value) {

			return value === null ? 'null' : (typeof value === 'object' || typeof value === 'function' ? typesReference[typesReference.toString.call(value)] || 'object' : typeof value);

		}

		is(value, type) {

			var {hooks} = this;

			return hooks.is.hasOwnProperty(type) ? !!hooks.is[type](value) : this.type(value) === type;

		}

	}

	let core = new WarbleCore;

	class WarbleFragment {

		constructor(value) {

			this.value = value;

			this.valid = true;

			this.invalid = false;

			this.error = {};

		}

		validate(name, param, parent) {

			var response = typeof core.hooks.validate[name] === 'function' ? core.hooks.validate[name].call(parent, this.value, param) : true;

			if (!response || core.is(response, 'array')) {

				this.valid = false;

				this.invalid = true;

				this.error[name] = true;

				if (core.is(response, 'array'))

					for (let index = 0, size = response.length; index < size; index++)

						this.error[`${name}:${response[index]}`] = true;

			} else

				delete this.error[name];

			return this;

		}

	}

	class WarbleModel {

		constructor(model) {

			if (typeof model === 'object')

				this.model = model;

			else

				throw new Error('WarbleModel expects an object.');

		}

		validate(data) {

			if (typeof data === 'object') {

				let

					response = {
						results: {},
						data: data,
						valid: true,
						invalid: false
					};

				for (let index in this.model) {

					let value = new WarbleFragment(data[index]);

					if (typeof this.model[index] === 'object')

						for (let validation in this.model[index])

							if (value.validate(validation, this.model[index][validation], data).invalid)

								[response.valid, response.invalid] = [false, true];

					response.results[index] = value;

				}

				return response;

			} else

				throw new Error('WarbleModel.validate expects an object.');

		}

	}

	class Warble extends WarbleCore {

		model(model) {

			return new WarbleModel(model);

		}

		validate(value, options) {

			if (typeof options === 'object') {

				var value = new WarbleFragment(value);

				for (let index in options)

					value.validate(index, options[index]);

				return value;

			} else

				throw new Error('Warble.validate expects an object.');

		}

	}

	var warble = new Warble;

	if (typeof module === 'object' && typeof module.exports === 'object')

		module.exports = warble;

};
