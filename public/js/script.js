/* Technaturally.com/js/script.js

Javascript Grid Demo (with a floating block)

Author: Pat Long
Date: 2018/01/14

License: CC-BY-SA-4.0
*/

(function(){
  var LOOPSANITY = 9999; // used to break gnarly while loops

  // shortcuts
  function getEl(selector) {
    return document.querySelector(selector);
  }
  function getEls(selector) {
    return document.querySelectorAll(selector);
  }

  // cache (used to store swap values)
  var cache = {};

  // some styles for the things
  var style = {
    // border helpers ;)
    Border: {
      getBorder: function(border) {
        return (border.width+' '+border.style+' '+border.color);
      },
      getBorderWidth: function(border, matrix) {
        return matrix.join(' ').replace(/1/g, border.width).replace(/0/g, (border.thinWidth));
      }
    },
    grid: {
      border: {
        width: '1px',
        thinWidth: 0,
        color: '#DDD',
        style: 'solid'
      },
      getBorder: function() {
        return style.Border.getBorder(this.border);
      }
    },
    block: {
      modes: [
        { border: { width: '3px', thinWidth: 0 } },
        { border: { width: '4px', thinWidth: '2px'} }
      ],
      modesB: [
        {},
        { boxSizing: 'content-box' }
      ],
      mode: 0,
      modeB: 0,
      boxSizing: 'border-box',
      border: {
        width: '3px',
        thinWidth: 0,
        style: 'solid',
        color: '#AAA'
      },
      offset: {
        x: 0,
        y: 0
      },
      borders: [1, 0, 0, 1],
      getBorder: function() {
        return style.Border.getBorder(this.border);
      },
      getBorderWidth: function() {
        return style.Border.getBorderWidth(this.border, this.borders);
      },
      getOffsetX: function(snap) {
        var offset = this.offset.x || 0;
        if (snap) {
          var borderWidth = parseInt(this.border.width) || 0;
          var borderThinWidth = parseInt(this.border.thinWidth) || 0;
          if (this.boxSizing == 'content-box') {
            if (this.borders[3]) {
              offset -= (borderWidth - 1);
              if (borderThinWidth) {
                offset -= borderThinWidth;
              }
            }
          }
        }
        return offset;
      },
      getOffsetY: function(snap) {
        var offset = this.offset.y || 0;
        if (snap) {
          var borderWidth = parseInt(this.border.width) || 0;
          var borderThinWidth = parseInt(this.border.thinWidth) || 0;
          if (this.boxSizing == 'content-box') {
            if (this.borders[0]) {
              offset -= (borderWidth - 1);
              if (borderThinWidth) {
                offset -= borderThinWidth;
              }
            }
          }
        }
        return offset;
      },
      refreshStyle: function() {
        if (this.mode >= 0 && this.mode < this.modes.length){
          var mode = this.modes[this.mode];
          if (mode.border) {
            if (mode.border.width !== undefined) {
              if (cache['style.block.border.width'] === undefined) {
                cache['style.block.border.width'] = this.border.width;
              }
              this.border.width = mode.border.width;
            }
            else if (cache['style.block.border.width'] !== undefined) {
              this.border.width = cache['style.block.border.width'];
            }
            if (mode.border.thinWidth !== undefined) {
              if (cache['style.block.border.thinWidth'] === undefined) {
                cache['style.block.border.thinWidth'] = this.border.thinWidth;
              }
              this.border.thinWidth = mode.border.thinWidth;
            }
            else if (cache['style.block.border.thinWidth'] !== undefined) {
              this.border.thinWidth = cache['style.block.border.thinWidth'];
            }
          }
        }
      },
      refreshStyleB: function() {
        if (this.modeB >= 0 && this.modeB < this.modesB.length){
          var modeB = this.modesB[this.modeB];
          if (modeB.boxSizing) {
            if (cache['style.block.boxSizing'] === undefined) {
              cache['style.block.boxSizing'] = this.boxSizing;
            }
            this.boxSizing = modeB.boxSizing;
          }
          else if (cache['style.block.boxSizing'] !== undefined) {
            this.boxSizing = cache['style.block.boxSizing'];
          }
          if (modeB.offset) {
            if (cache['style.block.offset'] === undefined) {
              cache['style.block.offset'] = this.offset;
            }
            this.offset = modeB.offset;
          }
          else if (cache['style.block.offset'] !== undefined) {
            this.offset = cache['style.block.offset'];
          }
        }
      },
      setMode: function(mode, lock) {
        if (mode >= this.modes.length) {
          if (lock) {
            mode = this.modes.length - 1;
          }
          else {
            mode = 0;
          }
        }
        else if (mode < 0) {
          if (lock) {
            mode = 0;
          }
          else {
            mode = this.modes.length - 1;
          }
        }
        this.mode = mode;
        this.refreshStyle();
      },
      setModeB: function(modeB, lock) {
        if (modeB >= this.modesB.length) {
          if (lock) {
            modeB = this.modesB.length - 1;
          }
          else {
            modeB = 0;
          }
        }
        else if (modeB < 0) {
          if (lock) {
            modeB = 0;
          }
          else {
            modeB = this.modesB.length - 1;
          }
        }
        this.modeB = modeB;
        this.refreshStyleB();
      }
    }
  };

  var config = {
    // optional preset number of cols or cell size
    grid: {
      cols: 32,
      size: undefined
    },
    // cheeky stuff below updates the block size
    block: {
      size: 25,
      snap: true
    }
  };

  // simple gridding
  var grid = {
    config: config.grid,
    style: style.grid,
    DOM: {
      grid: undefined,
      cols: [],
      rows: []
    },
    refresh: function() {
      var size = this.getSize();
      var cols = 0;
      var rows = 0;
      var width = 0;
      var height = 0;
      if (this.DOM.grid) {
        width = this.DOM.grid.offsetWidth;
        height = this.DOM.grid.offsetHeight;
        if (size) {
          cols = Math.ceil(width / size);
          rows = Math.ceil(height / size);
        }
      }
      this.fixCols(cols, size, height);
      this.fixRows(rows, size, width);
      this.styleCols(size, height);
      this.styleRows(size, width);
    },
    getCell: function(x, y) {
      var result = {};
      var size = this.getSize();
      result.col = Math.floor(x / size);
      result.row = Math.floor(y / size);
      result.x = (result.col + 0.5) * size;
      result.y = (result.row + 0.5) * size;
      return result;
    },
    setCols: function(cols) {
      this.config.size = undefined;
      this.config.cols = cols;
      this.refresh();
    },
    setSize: function(size) {
      this.config.cols = undefined;
      this.config.size = size;
      this.refresh();
    },
    getSize: function(size) {
      if (this.config.cols && this.DOM.grid) {
        return this.DOM.grid.offsetWidth / this.config.cols;
      }
      if (this.config.size) {
        return this.config.size;
      }
      return 25;
    },
    setGrid: function(el) {
      if (el && this.DOM.grid && this.DOM.grid != el) {
        // re-assign the DOM.cols parent
        for (var i=0; i < this.DOM.cols.length; i++) {
          var col = this.getCol(i);
          if (col) {
            el.appendChild(col);
          }
        }
        // re-assign the DOM.cols parent
        for (var i=0; i < this.DOM.rows.length; i++) {
          var row = this.getRow(i);
          if (row) {
            el.appendChild(row);
          }
        }
      }
      this.DOM.grid = el;
      this.refresh();
    },
    getCol: function(index) {
      return ((index < this.DOM.cols.length) ? this.DOM.cols[index] : undefined);
    },
    getRow: function(index) {
      return ((index < this.DOM.rows.length) ? this.DOM.rows[index] : undefined);
    },
    setCol: function(index, col) {
      this.fillCols(index+1);
      if (index < this.DOM.cols.length) {
        if (this.DOM.grid && col && col.parentElement != this.DOM.grid) {
          this.DOM.grid.appendChild(col);
        }
        this.DOM.cols[index] = col;
        col.className = 'col col-'+index;
      }
    },
    setRow: function(index, row) {
      this.fillRows(index+1);
      if (index < this.DOM.rows.length) {
        if (this.DOM.grid && row && row.parentElement != this.DOM.grid) {
          this.DOM.grid.appendChild(row);
        }
        this.DOM.rows[index] = row;
        row.className = 'row row-'+index;
      }
    },
    fixCols: function(length, size, height) {
      this.trimCols(length);
      this.fillCols(length, size);
    },
    fixRows: function(length, size, width) {
      this.trimRows(length);
      this.fillRows(length, size);
    },
    fillCols: function(length, size) {
      if (length >= LOOPSANITY) return;
      while (this.DOM.cols.length < length) {
        this.DOM.cols.push(undefined);
      }
    },
    fillRows: function(length, size) {
      if (length >= LOOPSANITY) return;
      while (this.DOM.rows.length < length) {
        this.DOM.rows.push(undefined);
      }
    },
    trimCols: function(length) {
      if (this.DOM.cols.length > length) {
        for (var i=length; i < this.DOM.cols.length; i++) {
          var col = this.getCol(i);
          if (col && col.parentElement) {
            col.parentElement.removeChild(col);
          }
        }
        this.DOM.cols.length = length;
      }
    },
    trimRows: function(length) {
      if (this.DOM.rows.length > length) {
        for (var i=length; i < this.DOM.rows.length; i++) {
          var row = this.getRow(i);
          if (row && row.parentElement) {
            row.parentElement.removeChild(row);
          }
        }
        this.DOM.rows.length = length;
      }
    },
    generateCol: function() {
      var el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.display = 'block';
      el.style.height = '100%';
      return el;
    },
    generateRow: function() {
      var el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.display = 'block';
      el.style.width = '100%';
      return el;
    },
    styleCol: function(index, size, height, last) {
      var col = this.getCol(index);
      if (!col) {
        col = this.generateCol();
        this.setCol(index, col);
      }
      if (col) {
        col.style.left = (index * size) + 'px';
        col.style.width = size + 'px';

        col.style.border = this.style.getBorder();
        col.style.borderWidth = style.Border.getBorderWidth(this.style.border, [0, (last ? 1 : 0), 0, 1]);
      }
    },
    styleRow: function(index, size, width, last) {
      var row = this.getRow(index);
      if (!row) {
        row = this.generateRow();
        this.setRow(index, row);
      }
      if (row) {
        row.style.top = (index * size) + 'px';
        row.style.height = size + 'px';

        row.style.border = this.style.getBorder();
        row.style.borderWidth = style.Border.getBorderWidth(this.style.border, [1, 0, (last ? 1 : 0), 0]);
      }
    },
    styleCols: function(size, height) {
      for (var i=0; i < this.DOM.cols.length; i++) {
        this.styleCol(i, size, height, (i == this.DOM.cols.length-1));
      }
    },
    styleRows: function(size, width) {
      for (var i=0; i < this.DOM.rows.length; i++) {
        this.styleRow(i, size, width, (i == this.DOM.rows.length-1));
      }
    }
  };

  // cheeky floating block
  var block = {
    config: config.block,
    style: style.block,
    DOM: {
      block: undefined
    },
    refresh: function() {
      this.styleBlock(this.DOM.block);
    },
    refreshBorders: function(deltaX, deltaY) {
      if (deltaX == 0) {
        this.style.borders[1] = 0;
        this.style.borders[3] = 0;
      }
      else if (deltaX > 0) {
        this.style.borders[1] = 1;
        this.style.borders[3] = 0;
      }
      else if (deltaX < 0) {
        this.style.borders[1] = 0;
        this.style.borders[3] = 1;
      }

      if (deltaY == 0) {
        this.style.borders[0] = 0;
        this.style.borders[2] = 0;
      }
      else if (deltaY > 0) {
        this.style.borders[0] = 0;
        this.style.borders[2] = 1;
      }
      else if (deltaY < 0) {
        this.style.borders[0] = 1;
        this.style.borders[2] = 0;
      }
      this.refresh();
    },
    setBlock: function(block) {
      this.DOM.block = block;
      this.refresh();
    },
    setSize: function(size) {
      this.config.size = size;
      this.refresh();
    },
    setPosition: function(x, y) {
      if (this.DOM.block) {
        var size = this.config.size;
        if (this.config.snap) {
          var cell = grid.getCell(x, y);
          x = cell.x;
          y = cell.y;
        }
        if (size) {
          x = Math.min((win.width - size), Math.max(0, (x - size / 2.0)));
          y = Math.min((win.height - size), Math.max(0, (y - size / 2.0)));
        }
        this.DOM.block.style.left = x + this.style.getOffsetX(this.config.snap) + 'px';
        this.DOM.block.style.top = y + this.style.getOffsetY(this.config.snap) + 'px';
      }
    },
    styleBlock: function(block) {
      var size = this.config.size || 0;
      if (block) {
        block.style.width = size + 'px';
        block.style.height = size + 'px';
        block.style.border = this.style.getBorder();
        block.style.borderWidth = this.style.getBorderWidth();
        block.style.boxSizing = this.style.boxSizing;
      }
    }
  };

  // mouse tracking
  var mouse = {
    x: 0,
    y: 0,
    delta: {
      x: 0,
      y: 0
    },
    setPosition: function(x, y) {
      if (x != this.x) {
        this.delta.x = x - this.x;
      }
      if (y != this.y) {
        this.delta.y = y - this.y;
      }
      this.x = x;
      this.y = y;
    }
  };

  // window tracking
  var win = {
    width: window.innerWidth || window.clientWidth,
    height: window.innerHeight || window.clientHeight,
    refresh: function() {
      this.width = window.innerWidth || window.clientWidth;
      this.height = window.innerHeight || window.clientHeight;
    }
  };

  // event handlers
  function windowResize(event) {
    win.refresh();

    if (win.width < 500) {
      grid.setCols(8);
    }
    else if (win.width < 800) {
      grid.setCols(16);
    }
    else {
      grid.setCols(32);
    }

    grid.refresh();
    block.setSize(grid.getSize());
  }
  function mouseMove(event) {
    mouse.setPosition(event.clientX, event.clientY);
    mouseMoved();
  }
  function mouseMoved() {
    block.setPosition(mouse.x, mouse.y);
    block.refreshBorders(mouse.delta.x, mouse.delta.y);
  }
  function touchMove(event) {
    mouse.setPosition(event.touches[0].clientX, event.touches[0].clientY);
    mouseMoved();
  }
  function keyUp(event) {
    if (event.key == 's' || event.key == 'S') {
      config.block.snap = !config.block.snap;
      block.setPosition(mouse.x, mouse.y);
    }
    else if (event.key == 'b') {
      style.block.setMode(style.block.mode + 1);
      block.setPosition(mouse.x, mouse.y);
      block.refresh();
    }
    else if (event.key == 'B') {
      style.block.setModeB(style.block.modeB + 1);
      block.setPosition(mouse.x, mouse.y);
      block.refresh();
    }
  }
  window.addEventListener('resize', windowResize);
  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('touchmove', touchMove);
  window.addEventListener('keyup', keyUp);
  document.addEventListener('DOMContentLoaded', function(event) { 
    // initialize grid with a container
    grid.setGrid(getEl('#background'));
    block.setBlock(getEl('#block'));
    block.setSize(grid.getSize());

    windowResize(event);
  });
})();
