function SelfScroll() {
	
	var thisClass = this;
	
	this.IntervalHandle = -1;
	this.Interval = 90;
	this.Step = 1;
	this.PageEndAction = "reverse";
	this.PageStartCount = 0;
	this.PageEndCount = 0;
	this.FallBack = 100;
	this.StartPause = 100;
	this.EndPause = 100;
	this.Offset = 0;
	
	this.TabIndex = 0;
	
	var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	
	var blnAutoRun = prefManager.getBoolPref("extensions.selfscroll.autorun" + this.TabIndex);
	if (blnAutoRun)
	{
		setTimeout(function() {thisClass.Start();}, 250);
	};
	
	this.click = function(e, id) {
		
		if (e.button == 0)	//left-click: toggle the scrolling
		{
			if(id == this.TabIndex)
				this.onoff();
			else
				this.switcher(id);
		}
		else if (e.button == 2)	//right-click: open options panel
		{
			this.showPrefs(id);
		}
		else if (e.button == 1)	//middle-click: reverse scroll direction (if 'reverse' mode is enabled)
		{
			if (this.PageEndAction == "reverse")
			{
				this.Step = (this.Step * -1);
			}
		}
	};
	
	this.refreshPrefs = function() {
		this.Offset = prefManager.getIntPref("extensions.selfscroll.scrolloffset" + this.TabIndex);
		if(this.Offset > window.content.scrollMaxY)
			this.Offset = window.content.scrollMaxY;
			
		this.FallBack = prefManager.getIntPref("extensions.selfscroll.fallback" + this.TabIndex);
		
		this.StartPause = prefManager.getIntPref("extensions.selfscroll.startpause" + this.TabIndex);
		this.EndPause = prefManager.getIntPref("extensions.selfscroll.endpause" + this.TabIndex);
		
		var intOldInterval = this.Interval;
		this.Interval = (101 - prefManager.getIntPref("extensions.selfscroll.scrollspeed" + this.TabIndex)) * 5;
		
		if ((this.Interval != intOldInterval) && (this.IntervalHandle != -1))
		{
			this.Stop();
			this.Start();
		}
		
		this.PageEndAction = prefManager.getCharPref("extensions.selfscroll.action" + this.TabIndex);
		
		if (this.Step < 1)
		{
			if (this.PageEndAction == "top")
			{
				this.Step = -100;
			}
			else if (this.PageEndAction == "reverse")
			{
				this.Step = -1;
			}
			else
			{
				this.Step = 1;
			}				
		}
		
	};
	
	this.switcher = function(id) {
		this.Stop();
		this.TabIndex = id;
		this.Start();
	};
	
	this.onoff = function() {
		if (this.IntervalHandle == -1)
		{
			this.Start();
		}
		else
		{
			this.Stop();
		}
	};
	
	this.Start = function() {
		this.refreshPrefs();
		
		if (this.PageEndAction == "top")
		{
			this.Step = 1;
		}
		
		this.IntervalHandle = setInterval(function(e) {thisClass.scroll()}, this.Interval);
		document.getElementById("selfscroll_icon" + this.TabIndex).src = "chrome://selfscroll/content/green.png";
		prefManager.setBoolPref("extensions.selfscroll.autorun" + this.TabIndex, true);
	};
	
	this.Stop = function() {
		if(this.IntervalHandle == -1)
			return;
	
		clearInterval(this.IntervalHandle);
		this.IntervalHandle = -1;
		document.getElementById("selfscroll_icon" + this.TabIndex).src = "chrome://selfscroll/content/red.png";
		prefManager.setBoolPref("extensions.selfscroll.autorun" + this.TabIndex, false);
	};
	
	this.showPrefs = function(id) {
		window.openDialog('chrome://selfscroll/content/selfscrollPrefs' + id + '.xul', '', 'centerscreen');
	};
	
	this.SetTitle = function(id) {
		var title = prefManager.getCharPref("extensions.selfscroll.saveas" + id);
		if(title != null && title != "" && typeof title !== "undefined")
			document.getElementById("selfscroll-pref_window").setAttribute("title", "SelfScroll Preferences (" + title + ")");
	};
	
	this.scroll = function() {
		this.refreshPrefs();
		
		var objDocument = window.content.document;
		
		var intPageHeight = Math.max(	objDocument.body.scrollHeight, 
										objDocument.body.offsetHeight, 
										objDocument.documentElement.scrollHeight, 
										objDocument.documentElement.offsetHeight	);
		
		if(intPageHeight > window.content.innerHeight)
		{
			if(this.Offset == 0 || this.Step < 0 || (this.Offset != 0 && window.content.pageYOffset <= this.Offset))
				window.content.scrollBy(0, this.Step);
			
			var blnAtTop = (window.content.pageYOffset <= 0);
			var blnAtEnd = false;
			if(this.Offset != 0 && window.content.pageYOffset >= this.Offset)
				blnAtEnd = true;
			else
				blnAtEnd = (window.content.pageYOffset >= (intPageHeight - window.content.innerHeight));
				
			if(blnAtTop)
			{
				this.PageStartCount++;
				if (this.StartPause < this.PageStartCount)
				{
					this.Step = 1;
					this.PageStartCount = 0;
				}
			}
			else if(blnAtEnd)
			{
				this.PageEndCount++;
				if (this.EndPause < this.PageEndCount)
				{
					if (this.PageEndAction == "reverse")
					{
						this.Step = -1;
						this.PageEndCount = 0;
					}
					else if (this.PageEndAction == "top")
					{
						this.Step = -this.FallBack;
						this.PageEndCount = 0;
					}
					else if (this.PageEndAction == "refresh")
					{
						this.Step = -this.FallBack;
						this.PageEndCount = 0;
						window.content.scrollTo(0, 0);
						window.content.location.reload(true);
					}
				}
			}
			else
			{
				this.PageStartCount = 0;
				this.PageEndCount = 0;
			}
		}
	};
}

var selfscroll = new SelfScroll();