window.onload = function ()  {
    var element1 = document.getElementById('btn1');
    element1.addEventListener('touchmove', function (e) {
	e.preventDefault();
	e.stopPropagation();
    });

    function clicked(e) {
	//alert('clicked ' + e.target.id);
	e.target.classList.toggle('highlighted');
    }

    var element = document.getElementById('btn1');
    element.addEventListener('click', clicked);

    element = document.getElementById('btn2');
    element.addEventListener('click', clicked);
}
