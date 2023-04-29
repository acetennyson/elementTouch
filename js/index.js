({
  window._acenavopen = false;
  
  $acenavclose = function(){
    if(window._acenavopen){
      let _target = e.target;
    //let link = e.target.nodeName;
      while(_target && _target.id != "ace-nav" && _target.id != "ace-menu" && !$acehref(_target.href) ){
        _target = _target.parentElement;
      }
      if (!_target) {
        let menu = document.getElementById("ace-menu");
        menu.click();
      //console.log(menu);
      }
    }
  }
  $acehref = function(link){
    let arr = ["", "#", "javascript::void", " "];
		if(!link || link=="", link) return false;
		for (let x of arr) {
			console.log(x);
			let i = link.indexOf(x);
			if(i!=-1) return true;
		}
		return false;
	}
})();
