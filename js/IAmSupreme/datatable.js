class DataTables {
    /**
     * 
     * @param {*} params 
     * @param {GetUsers|undefined} parent 
     */
    eventbus = new Eventbus();
    constructor(parent){
        this.parent = parent
        this.asc = parent.usersdata.asc;
        this.orderby = parent.usersdata.orderby;
        this.searchText = '';
        this.lastRequest = 0;
        this.searchDelay = Math.random() * 800 + 500;
    }
    createDataTable(params){
        this.selector = params.selector;
        this.setTable();
        this.data = params.data || this.parent.usersProps.data || [];
        this.columns = params.columns || this.parent.usersProps.columns || Array.from(this.table.querySelectorAll('thead tr th')).map(th => ({
            title: th.innerText,
            id: th.id,
            class: th.className,
            data: th.dataset.column
        }));
        // this.parent.usersdata.step = 1;
        this.rowsPerPage = params.rowsPerPage || this.parent.usersdata.size || 10;
        this.parent.usersProps.data = this.data;

        // params
        this.totalPages = Math.ceil((params.count?params.count:0) / this.rowsPerPage);
        this.bLengthChange = params.bLengthChange !== undefined ? params.bLengthChange : true;
        this.bDestroy = params.bDestroy !== undefined ? params.bDestroy : (this.parent.usersProps.bDestroy || false);
        this.columnDefs = params.columnDefs || this.parent.usersProps.columnDefs || [];
        this.responsive = params.responsive !== undefined ? params.responsive : (this.parent.usersProps.responsive || true) ;
        this.searching = params.searching !== undefined ? params.searching : (this.parent.usersProps.searching || true);
        this.info = params.info !== undefined ? params.info : true;
        this.paging = params.paging !== undefined ? params.paging : (this.parent.usersProps.paging || true);
        this.language = params.language || this.parent.usersProps.language || {
            search: '<i class="fas fa-search"></i>', // FontAwesome icon
            searchPlaceholder: 'Search...',
            paginate: {
                next: '<li class="page-link cursor-pointer">Next</li>',
                prev: '<li class="page-link cursor-pointer">Previous</li>'
            }
        };

        if(params.cb) this.setCB(params.cb || this.parent.usersProps.cb);
        
        if(!this.table || this.table.tagName.toLowerCase()!='table' ) throw `HTMLTableElement with selector(${params.selector}) not found`;
        if (this.bDestroy || this.data.length) {
            this.table.innerHTML = '';
            delete this.thead;
            delete this.tbody;
        }

        if(this.responsive){
            let str = this.table.outerHTML;
            // console.log(str)
            if(!this.table.parentElement.classList.contains('table-responsive')){
                this.table.parentElement.insertAdjacentHTML(
                    'afterbegin',
                    `<div class='table-responsive'>
                    ${str}
                    </div>`
                );
                this.table.remove();
                // this.table = document.querySelector(params.selector);
                this.setTable()
            }
            // table.classList.add('table-responsive');
        }

        // Create table header if not already present
        this.thead = this.table.querySelector('thead');
        if (!this.thead) {
            this.thead = this.table.createTHead();
            this.renderTableHead();
        }
        this.tbody = this.table.createTBody();
        this.loadedPages = Math.ceil(this.parent.usersProps.data.length || 0 / this.rowsPerPage)
        
        this.renderTableBody();
        if (this.searching) this.addSearchFunctionality();
        if (this.paging) this.addPaginationControls();

    }
    updateDataTable(params){
        if(!this.table || this.table.tagName.toLowerCase()!='table') this.setTable();
        // this.loading = false;
        this.data = params.data || this.data || [];
        this.columns = params.columns || this.columns || Array.from(table.querySelectorAll('thead tr th')).map(th => ({
            title: th.innerText,
            id: th.id,
            class: th.className,
            data: th.dataset.column
        }));
        this.parent.usersdata.step = this.parent.usersdata.step || 0;
        this.parent.usersdata.size = params.rowsPerPage || this.parent.usersdata.size;
        this.parent.usersProps.data = this.data;

        // params
        let counted = Math.ceil((params.count?params.count:0) / this.rowsPerPage);
        this.totalPages = params.count!=undefined?counted:(this.totalPages || 1);
        this.bLengthChange = params.bLengthChange !== undefined ? params.bLengthChange : this.bLengthChange;
        // this.bDestroy = params.bDestroy !== undefined ? params.bDestroy : this.bDestroy;
        this.columnDefs = params.columnDefs || this.columnDefs || [];
        this.responsive = params.responsive !== undefined ? params.responsive : this.responsive;
        this.searching = params.searching !== undefined ? params.searching : this.searching;
        this.info = params.info !== undefined ? params.info : this.info;
        this.paging = params.paging !== undefined ? params.paging : this.paging;
        this.language = params.language || this.language || {
            search: '<i class="fas fa-search"></i>', // FontAwesome icon
            searchPlaceholder: 'Search...',
            paginate: {
                next: '<li class="page-link cursor-pointer">Next</li>',
                prev: '<li class="page-link cursor-pointer">Previous</li>'
            }
        };
        if(params.cb){
            this.setCB(params.cb);
        }
        
        if(!this.table || this.table.tagName.toLowerCase()!='table' ) throw `HTMLTableElement with selector(${this.selector}) not found`;
        let redo = false;
        if ( (params.columns && params.columns.length) || (params.columnDefs && params.columnDefs.length)) {
            redo = true;
            this.table.innerHTML = '';
        }

        if(this.responsive){
            let str = this.table.outerHTML;
            // console.log(str)
            if(!this.table.parentElement.classList.contains('table-responsive')){
                this.table.parentElement.insertAdjacentHTML(
                    'afterbegin',
                    `<div class='table-responsive'>
                    ${str}
                    </div>`
                );
                this.table.remove();
                this.setTable()
            }
            
        }

        // Create table header if not already present
        this.thead = this.table.querySelector('thead');
        if (redo || !this.thead){
            if (!this.thead) this.thead = this.table.createTHead();
            this.renderTableHead();
        }
        if(redo || !this.tbody){
            if(this.tbody) this.tbody.remove(); 
            this.tbody = this.table.createTBody();
        }
        this.loadedPages = Math.ceil(this.parent.usersProps.data.length / this.rowsPerPage)
        
        this.renderTableBody();
        this.updatePaginationControls();
        // if (this.searching) this.addSearchFunctionality();
        // if (this.paging) this.addPaginationControls();

    }
    setTable(){
        /** @type {HTMLTableElement}  */
        this.table = document.querySelector(this.selector);
    }

    sendRequest(){
        this.lastRequest = Date.now();
        this.parent.getUsers(this.lastRequest);
    }

    renderTableHead(){
        // this.thead = this.table.createTHead();
        if (!this.thead) throw "table head not set";
        this.thead.innerHTML = '';
        const headerRow = this.thead.insertRow();
        this.columns.forEach((column, index) => {
            const th = document.createElement('th');
            if(column.data) th.addEventListener('click', ()=>{
                if(this.loading) return;
                this.parent.usersdata.asc = (column.data==this.parent.usersdata.orderby)?!this.parent.usersdata.asc:true;
                this.parent.usersdata.orderby = column.data;
                this.eventbus.dispatch('sort', this.parent.usersdata.orderby, this.parent.usersdata.asc)
                // this.sendRequest();
            })
            th.innerText = column.title;
            headerRow.appendChild(th);

            if (this.columnDefs[index] && !this.columnDefs[index].visible) {
                th.style.display = 'none';
            }
        });
    }

    renderTableBody() {
        if(!this.tbody) throw "table body not set";
        this.tbody.innerHTML = '';
        this.loading = false;
        
        if(this.parent.usersProps.data.length)
            this.parent.usersProps.data.forEach(rowData => {
                const row = this.tbody.insertRow();
                row.onclick = ()=>this.eventbus.dispatch('eltClick', rowData);
                this.columns.forEach((column, index) => {
                    const cell = row.insertCell();
                    cell.innerText = rowData[column.data] || '';
                    if (this.columnDefs[index] && !this.columnDefs[index].visible) {
                        cell.style.display = 'none';
                    }
                });
            });
        else
        this.displayNoData();
    }

    renderTableBody2() {
        if(!this.tbody) throw "table body not set";
        this.tbody.innerHTML = '';
        this.loading = false;
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const paginatedData = this.parent.usersProps.data.slice(startIndex, startIndex + this.rowsPerPage);

        paginatedData.forEach(rowData => {
            const row = this.tbody.insertRow();
            this.columns.forEach((column, index) => {
                const cell = row.insertCell();
                cell.innerText = rowData[column.data] || '';
                if (this.columnDefs[index] && !this.columnDefs[index].visible) {
                    cell.style.display = 'none';
                }
            });
        });
    }

    addPaginationControls() {
        const nextButton = document.createElement('div');
        nextButton.innerHTML = this.language.paginate.next;
        const prevButton = document.createElement('div');
        prevButton.innerHTML = this.language.paginate.prev;
        prevButton.firstChild.addEventListener('click', ()=>{
            if(this.loading) return; 
            this.lastRequest = Date.now();

            this.eventbus.dispatch('prevPage', this.lastRequest)
            // this.prevCB(this.lastRequest);
        })
        nextButton.firstChild.addEventListener('click', ()=>{
            if(this.loading) return;
            this.lastRequest = Date.now();
            this.eventbus.dispatch('nextPage', this.lastRequest)
            // this.nextCB(this.lastRequest);
        })


        const paginationDiv = document.createElement('ul');
        paginationDiv.classList.add('pagination');
        // paginationDiv.insertAdjacentHTML('afterbegin', )
        paginationDiv.appendChild(prevButton.firstChild);
        
        this.loadedPages = this.totalPages?this.totalPages:Math.ceil((this.parent.usersProps.data.length || 1) / this.parent.usersdata.size);
        const pageButton = document.createElement('li');
        pageButton.classList.add('page-item', 'flex');
        pageButton.textContent = `${this.parent.usersdata.step + 1}/${this.loadedPages}`;
        paginationDiv.appendChild(pageButton);
        
        
        paginationDiv.appendChild(nextButton.firstChild);
        // console.log(this.table.parentNode)
        this.table.parentNode.appendChild(paginationDiv);
    }

    // Add pagination controls
    addPaginationControls2() {
        const nextButton = document.createElement('div');
        nextButton.innerHTML = this.language.paginate.next;
        const prevButton = document.createElement('div');
        prevButton.innerHTML = this.language.paginate.prev;

        const paginationParent = document.createElement('div')
        paginationParent.classList.add('table-responsive');

        const paginationDiv = document.createElement('ul');
        paginationDiv.classList.add('pagination');
        // paginationDiv.insertAdjacentHTML('afterbegin', )
        paginationDiv.appendChild(prevButton.firstChild);
        
        // const loadedPages = Math.ceil(parent.usersProps.data.length / rowsPerPage);
        for (let i = 1; i <= this.loadedPages; i++) {
            const pageButton = document.createElement('li');
            pageButton.classList.add('page-link', 'cursor-pointer');
            pageButton.innerHTML = i;
            pageButton.addEventListener('click', () => {
                this.currentPage = i;
                // IAmSupreme.Element('.')
                this.renderTableBody();
                
            });
            paginationDiv.appendChild(pageButton);
        }
        
        paginationDiv.appendChild(nextButton.firstChild);

        paginationParent.appendChild(paginationDiv);
        this.table.parentNode.appendChild(paginationParent);
    }

    // Add search functionality
    addSearchFunctionality() {
        let tt = undefined;
        const searchDiv = document.createElement('div');
        searchDiv.innerHTML = this.language.search;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchDiv.classList.add('flex');
        searchInput.placeholder = this.language.searchPlaceholder;
        searchInput.addEventListener('input', () => {
            if(tt) {
                clearTimeout(tt)
                tt = undefined;
            }
            // if(this.loading) return; 
            const searchText = this.searchText = searchInput.value.toLowerCase();
            tt = setTimeout(() => {
                if(searchText!=this.searchText) return;
                this.lastRequest = Date.now();
                this.eventbus.dispatch('search', this.lastRequest, searchText);
                // this.searchCB(this.lastRequest, searchText);
            }, this.searchDelay);
            // this.searchCB(searchText);
        });

        searchDiv.appendChild(searchInput);
        this.table.parentNode.insertBefore(searchDiv, this.table);
    }

    // Update pagination controls
    updatePaginationControls() {
        const paginationDiv = this.table.parentNode.querySelector('.pagination');
        if (paginationDiv) {
            paginationDiv.remove();
        }
        this.addPaginationControls();
    }

    // Sort table by column
    sortTableByColumn(columnKey) {
        this.parent.usersProps.data.sort((a, b) => {
            if(typeof a[columnKey]=='number'){
                return (a[columnKey] - b[columnKey]) * (this.asc?1:-1);
            }else{

                let x = a[columnKey].toLowerCase();
                let y = b[columnKey].toLowerCase();
                if (x < y) {return -1 * (this.asc?1:-1);}
                if (x > y) {return 1 * (this.asc?1:-1);}
                return 0;
            }
            
        });
        this.renderTableBody();
        this.updatePaginationControls();
    }


    
    setCB(cb){
        if(!cb) cb = {};
        this.nextCB = cb.nextPage || this.nextCB || this.nextPag.bind(this);
        this.prevCB = cb.prevPage || this.prevCB || this.prevPag.bind(this);
        this.searchCB = cb.searchPage || this.searchCB || this.searchPag.bind(this);
        this.sortCB = cb.sortPage || this.sortCB || this.sortTableByColumn.bind(this);

        this.eventbus.subscribe('nextPage', this.nextCB.bind(this));
        this.eventbus.subscribe('prevPage', this.prevCB.bind(this));
        this.eventbus.subscribe('search', this.searchCB.bind(this));
        this.eventbus.subscribe('sort', this.sortCB.bind(this));

    }
    prevPag(){
        console.log('previous');
        if(--this.currentPage >= 1){
            this.renderTableBody();
            this.updatePaginationControls();
            return;
        }
        ++this.currentPage;
    }
    nextPag(){
        console.log('next');
        if(++this.currentPage <= (this.totalPages?this.totalPages:this.loadedPages)){
            this.renderTableBody();
            this.updatePaginationControls();
            return;
        }
        --this.currentPage;
    }
    searchPag(searchText){
        this.parent.usersProps.data = this.data.filter(row => {
            return this.columns.some(column => {
                return String(row[column.data]).toLowerCase().includes(searchText);
            });
        });
        this.currentPage = 1;
        this.renderTableBody();
        this.updatePaginationControls();
    }

    displayNoData(){
        if(this.tbody)
            this.tbody.innerHTML = `
            <tr>
                <td colspan="${this.columns?.length}" class="w-100 text-center">
                    <i class="fa fa-file-slash fs-3"></i>
                </td>
            </tr>`;
    }
    Load(){
        if(this.loading) return;
        if(this.tbody)
        this.tbody.innerHTML = `
        <tr>
            <td colspan="${this.columns?.length}" class="w-100 text-center">
                <div class="spinner-border text-primary"></div>
            </td>
        </tr>`;
        else
        this.table.innerHTML = `
        <caption class="w-100 text-center">
            <div class="spinner-border text-primary"></div>
        </caption>`;
        this.loading = true;
        // this.updatePaginationControls();
    }
    LoadFail(fxn){
        if(!this.loading) return;

        if(this.tbody){
            let tr = document.createElement('tr');
            tr.addEventListener('click', ()=>{
                this.eventbus.dispatch('reload', this.lastRequest);
            })
            tr.innerHTML = `
            <td colspan="${this.columns?.length}" class="w-100 text-center loading">
                <i class="fa fa-file-xmark fs-3 text-danger loadfail"></i>
            </td>`;
            this.tbody.innerHTML = ``;
            this.tbody.appendChild(tr);
        }else{
            let cap = document.createElement('caption');
            cap.addEventListener('click', ()=>{
                this.eventbus.dispatch('reload', this.lastRequest);
            })
            cap.className = "w-100 text-center loading";
            cap.innerHTML = `<i class="fa fa-xmark fs-3 text-danger loadfail"></i>`;
            this.table.innerHTML = '';
            this.table.appendChild(cap)
        }
        this.loading = false;
        let failE = this.table.querySelector('.loadfail');
        if(failE && fxn) failE.addEventListener('click', ()=>{
            this.Load();
            fxn();
        })
        this.updatePaginationControls();
    }

    
}