class Eventbus{
	constructor(){
		this.event = {};
		// console.log(this)
	}
	/**
	 * 
	 * @param {string} eventName 
	 * @param {Function} callback 
	 */
	subscribe(eventName, callback){
		if (!this.event[eventName]) {
			this.event[eventName] = [];
		}
		this.event[eventName].push(callback);
	}
	
	/**
	 * 
	 * @param {string} eventName 
	 * @param {Function} callback 
	 * @returns 
	 */
	unSubscribe(eventName, callback){
		if (!this.event[eventName]) return;
		this.event[eventName] = this.event[eventName].filter(cb => cb !== callback);
	}

	/**
	 * 
	 * @param {string} eventName 
	 * @param {any} payload 
	 * @returns {void}
	 */
	dispatch(eventName, ...payload){
		if (!this.event[eventName]) return;
		this.event[eventName].forEach(cb => {
			cb(...payload);
			// console.log(`Event ${eventName} has been dispatched`);
        });
	}
}
