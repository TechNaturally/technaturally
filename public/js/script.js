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

  // capitalizeFirstLetter
  // source: https://stackoverflow.com/a/1026087/1798697
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // deepExtend
  // source: https://gist.github.com/Ely-S/4191458
  function deepExtend(into, obj) {
    obj = obj || {};
    for (var i in obj) {
      into[i] = (typeof obj[i] == "object") ? deepExtend(obj[i].constructor(), obj[i]) : obj[i];
    }
    return into;
  }

  // cache (used to store swap values)
  var cache = {};

  // utilities to cycle through array
  var cycle = {
    getCycler: function(_this, name, names) {
      // cycle factory
      var cycler = {};
      name = name || 'step';
      names = names || name+'s';
      var nameIndex = name+'Index';
      var nameCap = capitalizeFirstLetter(name);
      var namesCap = capitalizeFirstLetter(names);
      cycler[names] = [];
      cycler[nameIndex] = -1; // no entries yet
      cycler['add'+nameCap] = function(entry) {
        this[names].push(entry);
        if (this[nameIndex] == -1) {
          this['set'+nameCap](0);
        }
      };
      cycler['add'+namesCap] = function(entries) {
        if (!entries || !entries.length) {
          return;
        }
        for (var i=0; i < entries.length; i++) {
          this['add'+nameCap](entries[i]);
        }
      };
      cycler['get'+nameCap] = function() {
        if (this[nameIndex] >= 0 && this[nameIndex] < this[names].length) {
          return this[names][this[nameIndex]];
        }
      };
      cycler['next'+nameCap] = function() {
        this['set'+nameCap](this[nameIndex] + 1);
      };
      cycler['set'+nameCap] = function(index) {
        this[nameIndex] = cycle.boundIndex(index, this[names]);
        var entry = this['get'+nameCap]();
        if (typeof this.refresh == 'function') {
          this.refresh(entry, _this);
        }
        return entry;
      };
      return cycler;
    },
    boundIndex: function(index, items, lock) {
      if (!items || !items.length) {
        return -1;
      }
      if (index >= items.length) {
        if (lock) {
          index = items.length - 1;
        }
        else {
          index = 0;
        }
      }
      else if (index < 0) {
        if (lock) {
          index = 0;
        }
        else {
          index = items.length - 1;
        }
      }
      return index;
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
    },
    blocks: {
      tracer: undefined
    }
  };

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
      borderMode: undefined,
      boxSizeMode: undefined,
      current: {
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
        borders: [1, 0, 0, 1]
      },
      getBorder: function() {
        return style.Border.getBorder(this.current.border);
      },
      getBorderWidth: function() {
        return style.Border.getBorderWidth(this.current.border, this.current.borders);
      },
      refreshStyle: function(fresh, _this) {
        _this = _this || this;
        if (fresh) {
          deepExtend(_this.current, fresh);
        }
        else {
          if (this.borderMode) {
            deepExtend(_this.current, this.borderMode.getMode());
          }
          if (this.boxSizeMode) {
            deepExtend(_this.current, this.boxSizeMode.getMode());
          }
        }
      },
      getOffsetX: function(snap) {
        var offset = this.current.offset.x || 0;
        if (snap) {
          var borderWidth = parseInt(this.current.border.width) || 0;
          var borderThinWidth = parseInt(this.current.border.thinWidth) || 0;
          if (this.current.boxSizing == 'content-box') {
            if (this.current.borders[3]) {
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
        var offset = this.current.offset.y || 0;
        if (snap) {
          var borderWidth = parseInt(this.current.border.width) || 0;
          var borderThinWidth = parseInt(this.current.border.thinWidth) || 0;
          if (this.current.boxSizing == 'content-box') {
            if (this.current.borders[0]) {
              offset -= (borderWidth - 1);
              if (borderThinWidth) {
                offset -= borderThinWidth;
              }
            }
          }
        }
        return offset;
      }
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

  // cheeky floating blocks
  var blocks = {
    config: config.blocks,
    style: style.block,
    DOM: {
      blocks: undefined
    },
    blocks: [],
    count: 0,
    refresh: function() {
      for (var i=0; i < this.blocks.length; i++) {
        var block = this.blocks[i];
        if (block) {
          block.refresh();
        }
      }
    },
    setBlocks: function(blocks) {
      this.DOM.blocks = blocks;
      this.refresh();
    },
    setPosition: function(x, y) {
      if (this.blocks.length) {
        var oldPos = this.blocks[0].position;
        var delta = {
          x: (x - oldPos.x),
          y: (y - oldPos.y)
        };

        var newBlock = this.generateBlock({lifespan: 500});
        newBlock.setPosition(oldPos.x, oldPos.y);
        newBlock.setDelta(delta.x, delta.y);

        this.blocks[0].setPosition(x, y);
        this.blocks[0].setDelta(delta.x, delta.y);
      }
    },
    setSize: function(size, _this) {
      _this = _this || this;
      _this.config.size = size;
      _this.refresh();
    },
    refreshBorders: function(deltaX, deltaY, _this) {
      _this = _this || this;

      if (deltaX == 0) {
        _this.style.current.borders[1] = 0;
        _this.style.current.borders[3] = 0;
      }
      else if (deltaX > 0) {
        _this.style.current.borders[1] = 1;
        _this.style.current.borders[3] = 0;
      }
      else if (deltaX < 0) {
        _this.style.current.borders[1] = 0;
        _this.style.current.borders[3] = 1;
      }

      if (deltaY == 0) {
        _this.style.current.borders[0] = 0;
        _this.style.current.borders[2] = 0;
      }
      else if (deltaY > 0) {
        _this.style.current.borders[0] = 0;
        _this.style.current.borders[2] = 1;
      }
      else if (deltaY < 0) {
        _this.style.current.borders[0] = 1;
        _this.style.current.borders[2] = 0;
      }
    },
    styleBlock: function(block, _this) {
      _this = _this || this;
      var size = _this.config.size || 0;
      if (block) {
        block.style.width = size + 'px';
        block.style.height = size + 'px';
        block.style.border = _this.style.getBorder();
        block.style.borderWidth = _this.style.getBorderWidth();
        block.style.boxSizing = _this.style.current.boxSizing;
      }
    },
    generateBlock: function(data, _config, _style) {
      // cheeky floating block factory
      var block = {
        data: data || {},
        config: _config || config.block,
        style: _style || style.block,
        position: {
          x: 0,
          y: 0
        },
        delta: {
          x: -1,
          y: -1
        },
        DOM: {
          block: undefined
        },
        setBlock: function(block) {
          this.DOM.block = block;
          this.refresh();
        },
        refresh: function() {
          this.styleBlock(this.DOM.block);
        },
        refreshBorders: function() {
          blocks.refreshBorders(this.delta.x, this.delta.y, this);
          this.refresh();
        },
        setSize: function(size) {
          blocks.setSize(size, this);
        },
        setDelta: function (deltaX, deltaY) {
          if (deltaX != 0) {
            this.delta.x = deltaX;
          }
          if (deltaY != 0) {
            this.delta.y = deltaY;
          }
          this.refreshBorders();
        },
        setPosition: function(x, y) {
          this.position.x = x;
          this.position.y = y;
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
          blocks.styleBlock(block, this);
        }
      };

      block.data.id = this.count++;
      if (this.DOM.blocks) {
        var blockDOM = document.createElement('div');
        blockDOM.className = 'block';
        this.DOM.blocks.appendChild(blockDOM);
        block.setBlock(blockDOM);
      }

      var lifespan = parseInt(block.data.lifespan);
      if (lifespan >= 0) {
        var _this = this;
        setTimeout(function() {
          _this.destroyBlock(block);
        }, lifespan);
      }

      this.blocks.push(block);

      return block;
    },
    destroyBlock: function(block) {
      var index = this.blocks.findIndex(function(checkBlock) {
        return (checkBlock && checkBlock.data && block && block.data && checkBlock.data.id == block.data.id);
      });
      if (block && block.DOM && block.DOM.block) {
        block.DOM.block.parentElement.removeChild(block.DOM.block);
      }
      if (index != -1) {
        this.blocks.splice(index, 1);
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
      this.delta.x = (x - this.x);
      this.delta.y = (y - this.y);
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


  config.blocks.tracer = cycle.getCycler(this, 'mode');
  config.blocks.tracer.addMode(
    {
      threshold: 10,
      lifepan: 500
    }
  );

  style.block.borderMode = cycle.getCycler(style.block, 'mode'),
  style.block.borderMode.refresh = style.block.refreshStyle;
  style.block.borderMode.addModes([
    {
      border: {
        width: '3px',
        thinWidth: 0
      }
    },
    {
      border: {
        width: '4px',
        thinWidth: '2px'
      }
    }
  ]);
  style.block.boxSizeMode = cycle.getCycler(style.block, 'mode'),
  style.block.boxSizeMode.refresh = style.block.refreshStyle;
  style.block.boxSizeMode.addModes([
    {},
    { boxSizing: 'content-box' }
  ]);


  var block;

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
    blocks.setSize(grid.getSize());
  }
  function mouseMove(event) {
    mouse.setPosition(event.clientX, event.clientY);
    mouseMoved();
  }
  function mouseMoved() {
    blocks.setPosition(mouse.x, mouse.y);
  }
  function touchMove(event) {
    mouse.setPosition(event.touches[0].clientX, event.touches[0].clientY);
    mouseMoved();
  }
  function keyUp(event) {
    if (event.key == 's' || event.key == 'S') {
      config.block.snap = !config.block.snap;
      blocks.setPosition(mouse.x, mouse.y);
    }
    else if (event.key == 'b') {
      //style.block.setMode(style.block.mode + 1);
      style.block.borderMode.nextMode();
      blocks.setPosition(mouse.x, mouse.y);
    }
    else if (event.key == 'B') {
      style.block.boxSizeMode.nextMode();
      blocks.setPosition(mouse.x, mouse.y);
    }
  }
  window.addEventListener('resize', windowResize);
  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('touchmove', touchMove);
  window.addEventListener('keyup', keyUp);
  document.addEventListener('DOMContentLoaded', function(event) { 
    // initialize grid with a container
    grid.setGrid(getEl('#grid'));
    
    // initialize blocks container
    blocks.setBlocks(getEl('#blocks'));
    blocks.setSize(grid.getSize());

    block = blocks.generateBlock();

    windowResize(event);
  });
})();
