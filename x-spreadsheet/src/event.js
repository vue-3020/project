export function bind(target, name, fn) {
  target.addEventListener(name, fn);
}
export function unbind(target, name, fn) {
  target.removeEventListener(name, fn);
}
export function mouseMoveUp(target, movefunc, upfunc) {
  bind(target, 'mousemove', movefunc);
  const t = target;
  t.xEvtUp = (evt) => {
    // console.log('mouseup>>>');
    unbind(target, 'mousemove', movefunc);
    unbind(target, 'mouseup', target.xEvtUp);
    upfunc(evt);
  };
  bind(target, 'mouseup', target.xEvtUp);
}

function calTouchDirection(spanx, spany, evt, cb) {
  let direction = '';
  if (Math.abs(spanx) > Math.abs(spany)) {
    // horizontal
    direction = spanx > 0 ? 'right' : 'left';
  } else {
    // vertical
    direction = spany > 0 ? 'down' : 'up';
  }
  cb(direction, spany, evt);
}
// cb = (direction, distance) => {}
export function bindTouch(target, { move, end }) {
  let startx = 0;
  let starty = 0;
  bind(target, 'touchstart', (evt) => {
    const { pageX, pageY } = evt.touches[0];
    startx = pageX;
    starty = pageY;
  });
  bind(target, 'touchmove', (evt) => {
    if (!move) return;
    const { pageX, pageY } = evt.changedTouches[0];
    const spanx = pageX - startx;
    const spany = pageY - starty;
    // console.log('spanx:', spanx, ', spany:', spany);
    calTouchDirection(spanx, spany, evt, move);
    startx = pageX;
    starty = pageY;
    evt.preventDefault();
  });
  bind(target, 'touchend', (evt) => {
    if (!end) return;
    const { pageX, pageY } = evt.changedTouches[0];
    const spanx = pageX - startx;
    const spany = pageY - starty;
    calTouchDirection(spanx, spany, evt, end);
  });
}
