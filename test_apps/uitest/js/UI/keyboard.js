function keyboardTest() {
  (function designmode(id) {
    var iframe = document.querySelector('#' + id);
    iframe.contentDocument.designMode = 'on';
    iframe.contentDocument.body.textContent = 'Hola supermercado';
  })('iframe-designmode');

  (function contentEditable(id) {
    var iframe = document.querySelector('#' + id);
    iframe.contentDocument.body.setAttribute('contenteditable', true);
    iframe.contentDocument.body.textContent = 'Telebancos por aqui';
  })('iframe-contenteditable');

  var readme = document.getElementById('readme');
  var readmeBtn = document.getElementById('readme_button');
  readme.hidden = true;

  readmeBtn.addEventListener('click',
    function toggle_readme() {
      readme.hidden = !readme.hidden;
      if (readme.hidden) {
        readmeBtn.textContent = 'Show README';
      } else {
        readmeBtn.textContent = 'Hide README';
      }
    }
  );

  [].forEach.call(document.querySelectorAll('textarea'), function(el) {
    el.addEventListener('keyup', function(e) {
      dump(+new Date() + ' receive keyup ' + ' ' + this.value.charCodeAt(this.value.length - 1) + ' ' + e.keyCode + '\n');
    });
  });

  [].forEach.call(document.querySelectorAll('input'), function(el) {
    el.addEventListener('keyup', function(e) {
      dump(+new Date() + ' receive keyup ' + ' ' + this.value.charCodeAt(this.value.length - 1) + ' ' + e.keyCode + '\n');
    });
  });
}
window.addEventListener('load', keyboardTest);
