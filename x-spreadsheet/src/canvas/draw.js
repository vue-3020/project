/* global window */
function dpr() {
  return window.devicePixelRatio || 1;
}

function thinLineWidth() {
  return dpr() - 0.5;
}

function npx(px) {
  return parseInt(px * dpr(), 10);
}

class DrawBox {
  constructor(x, y, w, h, padding = 0) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.padding = padding;
    this.bgcolor = '#ffffff';
    // border: [width, style, color]
    this.borderTop = null;
    this.borderRight = null;
    this.borderBottom = null;
    this.borderLeft = null;
  }

  setBorders({
    top, bottom, left, right,
  }) {
    if (top) this.borderTop = top;
    if (right) this.borderRight = right;
    if (bottom) this.borderBottom = bottom;
    if (left) this.borderLeft = left;
  }

  innerWidth() {
    return this.width - (this.padding * 2);
  }

  innerHeight() {
    return this.height - (this.padding * 2);
  }

  textx(align) {
    const { width, padding } = this;
    let { x } = this;
    if (align === 'left') {
      x += padding;
    } else if (align === 'center') {
      x += width / 2;
    } else if (align === 'right') {
      x += width - padding;
    }
    return x;
  }

  texty(align, fontSize, hoffset) {
    const { height, padding } = this;
    let { y } = this;
    if (align === 'top') {
      y += padding;
    } else if (align === 'middle') {
      const y1 = y + height / 2 - hoffset;
      const y2 = y + padding + fontSize / 2 + 1;
      if (y1 < y2) y = y2;
      else y = y1;
    } else if (align === 'bottom') {
      y += height - hoffset * 2 - padding;
    }
    return y;
  }

  topxys() {
    const { x, y, width } = this;
    return [[x, y], [x + width, y]];
  }

  rightxys() {
    const {
      x, y, width, height,
    } = this;
    return [[x + width, y], [x + width, y + height]];
  }

  bottomxys() {
    const {
      x, y, width, height,
    } = this;
    return [[x, y + height], [x + width, y + height]];
  }

  leftxys() {
    const {
      x, y, height,
    } = this;
    return [[x, y], [x, y + height]];
  }
}

function drawFontLine(type, tx, ty, align, valign, blheight, blwidth) {
  const floffset = { x: 0, y: 0 };
  if (type === 'underline') {
    if (valign === 'bottom') {
      floffset.y = 0;
    } else if (valign === 'top') {
      floffset.y = -(blheight + 2);
    } else {
      floffset.y = -blheight / 2;
    }
  } else if (type === 'strike') {
    if (valign === 'bottom') {
      floffset.y = blheight / 2;
    } else if (valign === 'top') {
      floffset.y = -((blheight / 2) + 2);
    }
  }

  if (align === 'center') {
    floffset.x = blwidth / 2;
  } else if (align === 'right') {
    floffset.x = blwidth;
  }
  this.line(
    [tx - floffset.x, ty - floffset.y],
    [tx - floffset.x + blwidth, ty - floffset.y],
  );
}

class Draw {
  constructor(el, width, height) {
    this.el = el;
    this.ctx = el.getContext('2d');
    this.resize(width, height);
    this.ctx.scale(dpr(), dpr());
  }

  resize(width, height) {
    // console.log('dpr:', dpr);
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height}px`;
    this.el.width = npx(width);
    this.el.height = npx(height);
  }

  clear() {
    const { width, height } = this.el;
    this.ctx.clearRect(0, 0, width, height);
    return this;
  }

  attr(options) {
    Object.assign(this.ctx, options);
    return this;
  }

  save() {
    this.ctx.save();
    this.ctx.beginPath();
    return this;
  }

  restore() {
    this.ctx.restore();
    return this;
  }

  beginPath() {
    this.ctx.beginPath();
    return this;
  }

  translate(x, y) {
    this.ctx.translate(npx(x), npx(y));
    return this;
  }

  fillRect(x, y, w, h) {
    this.ctx.fillRect(npx(x) - 0.5, npx(y) - 0.5, npx(w), npx(h));
    return this;
  }

  fillText(text, x, y) {
    this.ctx.fillText(text, npx(x), npx(y));
    return this;
  }

  /*
    txt: render text
    box: DrawBox
    attr: {
      align: left | center | right
      valign: top | middle | bottom
      color: '#333333',
      strike: false,
      font: {
        name: 'Arial',
        size: 14,
        bold: false,
        italic: false,
      }
    }
    textWrap: text wrapping
  */
  text(txt, box, attr = {}, textWrap = true) {
    const { ctx } = this;
    const {
      align, valign, font, color, strike, underline,
    } = attr;
    const tx = box.textx(align);
    ctx.save();
    this.attr({
      textAlign: align,
      textBaseline: valign,
      font: `${font.italic ? 'italic' : ''} ${font.bold ? 'bold' : ''} ${npx(font.size)}px ${font.name}`,
      fillStyle: color,
      strokeStyle: color,
    });
    const txtWidth = ctx.measureText(txt).width;
    let hoffset = 0;
    if (textWrap) {
      const n = Math.ceil(txtWidth / box.innerWidth());
      hoffset = ((n - 1) * font.size) / 2;
    }
    let ty = box.texty(valign, font.size, hoffset);
    // console.log('tx: ', tx, ', ty:', ty);
    if (textWrap && txtWidth > box.innerWidth()) {
      const textLine = { len: 0, start: 0 };
      for (let i = 0; i < txt.length; i += 1) {
        if (textLine.len >= box.innerWidth()) {
          this.fillText(txt.substring(textLine.start, i), tx, ty);
          if (strike) {
            drawFontLine.call(this, 'strike', tx, ty, align, valign, font.size, textLine.len);
          }
          if (underline) {
            drawFontLine.call(this, 'underline', tx, ty, align, valign, font.size, textLine.len);
          }
          ty += font.size + 2;
          textLine.len = 0;
          textLine.start = i;
        }
        textLine.len += ctx.measureText(txt[i]).width;
      }
      if (textWrap && textLine.len > 0) {
        this.fillText(txt.substring(textLine.start), tx, ty);
        if (strike) {
          drawFontLine.call(this, 'strike', tx, ty, align, valign, font.size, textLine.len);
        }
        if (underline) {
          drawFontLine.call(this, 'underline', tx, ty, align, valign, font.size, textLine.len);
        }
      }
    } else {
      this.fillText(txt, tx, ty);
      if (strike) {
        drawFontLine.call(this, 'striket', tx, ty, align, valign, font.size, txtWidth);
      }
      if (underline) {
        drawFontLine.call(this, 'underline', tx, ty, align, valign, font.size, txtWidth);
      }
    }
    ctx.restore();
    return this;
  }

  border(style, color) {
    const { ctx } = this;
    ctx.lineWidth = thinLineWidth;
    ctx.strokeStyle = color;
    // console.log('style:', style);
    if (style === 'medium') {
      ctx.lineWidth = npx(1) + 0.5;
    } else if (style === 'thick') {
      ctx.lineWidth = npx(2);
    } else if (style === 'dashed') {
      ctx.setLineDash([npx(3), npx(2)]);
    } else if (style === 'dotted') {
      ctx.setLineDash([npx(1), npx(1)]);
    } else if (style === 'double') {
      ctx.setLineDash([npx(2), 0]);
    }
    return this;
  }

  line(...xys) {
    const { ctx } = this;
    if (xys.length > 1) {
      const [x, y] = xys[0];
      ctx.moveTo(npx(x) - 0.5, npx(y) - 0.5);
      for (let i = 1; i < xys.length; i += 1) {
        const [x1, y1] = xys[i];
        ctx.lineTo(npx(x1) - 0.5, npx(y1) - 0.5);
      }
      ctx.stroke();
    }
    return this;
  }

  strokeBorders(box) {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    // border
    const {
      borderTop, borderRight, borderBottom, borderLeft,
    } = box;
    if (borderTop) {
      this.border(...borderTop);
      this.line(...box.topxys());
    }
    if (borderRight) {
      this.border(...borderRight);
      this.line(...box.rightxys());
    }
    if (borderBottom) {
      this.border(...borderBottom);
      this.line(...box.bottomxys());
    }
    if (borderLeft) {
      this.border(...borderLeft);
      this.line(...box.leftxys());
    }
    ctx.restore();
  }

  rect(box, dtextcb) {
    const { ctx } = this;
    const {
      x, y, width, height, bgcolor,
    } = box;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = bgcolor || '#fff';
    // ctx.strokeStyle = '#e6e6e6';
    ctx.rect(npx(x) - 0.5, npx(y) - 0.5, npx(width), npx(height));
    ctx.clip();
    ctx.fill();
    // ctx.stroke();
    this.strokeBorders(box);
    dtextcb();
    ctx.restore();
  }
}

export default {};
export {
  Draw,
  DrawBox,
  thinLineWidth,
  npx,
};
