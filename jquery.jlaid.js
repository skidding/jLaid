;(function($, window, document, undefined)
{
	/* Layout Grid constructor */

	var Laid = function(wrapper, options)
	{
		if(!(this.children = $(wrapper).find('> li')).length)
		{
			return;
		}
		for(var i in Laid.defaults)
		{
			if(options[i] === undefined)
			{
				options[i] = Laid.defaults[i];
			}
		}
		this.wrapper = wrapper;
		this.options = options;

		this.init();
	};

	/* Laid static */

	Laid.defaults =
	{
		delay: 200,
		stretch: false,
		responsive: false,
		debug: false
	};
	Laid.INFINITE = 999999;

	/* Laid prototype */

	Laid.prototype.init = function()
	{
		$(this.wrapper).css('position', 'relative');

		this.children.each(function()
		{
			$.data(this, 'width', $(this).outerWidth());
			$.data(this, 'inner', $(this).outerWidth() - $(this).width());
		});
		this.children.css('position', 'absolute');

		var that = this;

		$(window).resize(function()
		{
			that.presize();
		});
		this.resize();
	};
	Laid.prototype.each = function(callback)
	{
		for(var i = 0; i < this.lines.length; i++)
		{
			if(callback.call(this.lines[i], i, this.lines[i]) === false)
			{
				return false;
			}
		}
		return true;
	};
	Laid.prototype.presize = function()
	{
		if(this.timeout)
		{
			window.clearTimeout(this.timeout);
		}
		var that = this;

		this.timeout = window.setTimeout(function()
		{
			that.resize(that.timeout = null);
		},
		this.options.delay);
	};
	Laid.prototype.resize = function()
	{
		this.log('generating...');

		this.generate(this.time());
	};
	Laid.prototype.generate = function(time)
	{
		this.lines = [ new Line() ];
		this.stack = [];
		this.width = $(this.wrapper).width();

		var next, that = this;

		for(var i = 0, c; i < this.children.length; i++)
		{
			c = this.children[i];

			this.append(next = that.next
			(
				$.data(c, 'width'), $(c).outerHeight()
			));
			$(c).css({ left: next.x, top: next.y });
		};
		if(!this.options.debug)
		{
			return;
		}
		var t = this.time() - time;

		this.each(function(i, line)
		{
			that.log('line #' + (i + 1) + ' [' + line.y + ']');

			this.each(function(j, block)
			{
				that.log
				(
					'> #' + (j + 1) + ' [' +
					this.x + ' ' +
					this.y + ' ' +
					this.width + ' ' +
					this.height + ']'
				);
			});
		});
		that.log('generated in ' + t + 'ms');
	};
	Laid.prototype.next = function(width, height)
	{
		var next = { x: Laid.INFINITE, y: Laid.INFINITE, f: 0 }, that = this;

		this.each(function(i, line)
		{
			if(this.y > next.y)
			{
				return;
			}
			if(that.check(0, this.y, width, height))
			{
				next.x = 0;
				next.y = this.y;
			}
			this.each(function(j, block)
			{
				if(this.x > next.x && line.y == next.y)
				{
					return;
				}
				if(that.check(this.x + this.width, line.y, width, height))
				{
					next.x = this.x + this.width;
					next.y = line.y;
				}
			});
		});
		next.width = width;
		next.height = height;

		return next;
	};
	Laid.prototype.check = function(x, y, width, height)
	{
		if(x && x + width > this.width)
		{
			return false;
		}
		return this.each(function(i, line)
		{
			if(this.y >= y + height)
			{
				return true;
			}
			return this.each(function(j, block)
			{
				if(x >= this.x + this.width)
				{
					return true;
				}
				if(x + width <= this.x)
				{
					return true;
				}
				if(y >= this.y + this.height)
				{
					return true;
				}
				if(y + height <= this.y)
				{
					return true;
				}
				return false;
			});
		});
	};
	Laid.prototype.append = function(block)
	{
		var index = 0, that = this;

		this.stack.push(this.copy(block));

		this.each(function(i, line)
		{
			if(this.y >= block.y + block.height)
			{
				if(this.y == block.y + block.height)
				{
					index = -1;
				}
				return;
			}
			index = i + 1;
		});
		if(index != -1)
		{
			this.lines.splice(index, 0, new Line(block.y + block.height));
		}
		for(var k = 0, s; k < this.stack.length; k++)
		{
			s = this.stack[k];

			this.each(function(i, line)
			{
				if(this.y >= s.y && this.y < s.y + s.height)
				{
					this.insert(s);
				}
			});
		}
	};
	Laid.prototype.copy = function(block)
	{
		var copy = {};

		for(var i in block)
		{
			if(block.hasOwnProperty(i))
			{
				copy[i] = block[i];
			}
		}
		return copy;
	};
	Laid.prototype.log = function(message)
	{
		if(this.options.debug)
		{
			console.log('jLaid: ' + message);
		}
	};
	Laid.prototype.time = function()
	{
		return new Date().getTime();
	};

	/* Line constructor */

	var Line = function(y)
	{
		this.y = y || 0;
	};

	/* Line prototype */

	Line.prototype = [];

	Line.prototype.each = function(callback)
	{
		for(var i = 0; i < this.length; i++)
		{
			if(callback.call(this[i], i, this[i]) === false)
			{
				return false;
			}
		}
		return true;
	};
	Line.prototype.insert = function(block)
	{
		var index = 0;

		this.each(function(j)
		{
			if(this == block)
			{
				index = -1;

				return false;
			}
			if(this.x <= block.x)
			{
				index = j + 1;
			}
			return true;
		});
		if(index != -1)
		{
			this.splice(index, 0, block);
		}
	};

	/* plugin */

	$.fn.laid = function(options)
	{
		return this.each(function()
		{
			new Laid(this, options || {});
		});
	};
})
(jQuery, window, document);

/* Array.prototype.indexOf */

if(!Array.prototype.indexOf)
{
	Array.prototype.indexOf = function(obj, start)
	{
		for(var i = (start || 0), n = this.length; i < n; i++)
		{
			if(this[i] === obj)
			{
				return i;
			}
		}
		return -1;
	};
}