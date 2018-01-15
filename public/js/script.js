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
          x = Math.max(0, (x - size / 2.0));
          y = Math.max(0, (y - size / 2.0));
        }
        this.DOM.block.style.left = x + this.style.offset.x + 'px';
        this.DOM.block.style.top = y + this.style.offset.y + 'px';
      }
    },
    styleBlock: function(block) {
      var size = this.config.size || 0;
      if (block) {
        block.style.width = size + 'px';
        block.style.height = size + 'px';
        block.style.border = this.style.getBorder();
        block.style.borderWidth = this.style.getBorderWidth();
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

  // random cache (used to store swap values)
  var cache = {};

  // event handlers
  function windowResize(event) {
    var w = window.innerWidth || window.clientWidth;
    var h = window.innerHeight || window.clientHeight;

    if (w < 500) {
      if (config.grid.cols != 16) {
        cache['config.grid.cols'] = config.grid.cols;
      }
      config.grid.cols = 16;
    }
    else {
      config.grid.cols = cache['config.grid.cols'];
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
    else if (event.key == 'b' || event.key == 'B') {
      // swap style.block.border.thinWidth between 0 and its cached value
      if (style.block.border.thinWidth) {
        cache['style.block.border.thinWidth'] = style.block.border.thinWidth;
        style.block.border.thinWidth = 0;
      }
      else if (cache['style.block.border.thinWidth']){
        style.block.border.thinWidth = cache['style.block.border.thinWidth'];
      }
      else {
        // default value
        style.block.border.thinWidth = '2px';
      }
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
