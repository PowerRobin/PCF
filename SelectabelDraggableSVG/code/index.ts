import { stringify } from "querystring";
import {IInputs, IOutputs} from "./generated/ManifestTypes";

const elemRecordId: string = "elemRecId";


export class SelectableDraggableSVG implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	// Cached context object for the latest updateView
	private contextObj: ComponentFramework.Context<IInputs>;

	// Div element created as part of this control's main container
	private mainContainer: HTMLDivElement;
	// textbox for debugging on top
	private debugSpan: HTMLSpanElement;

	// Image element created as part of this control's table
	private svgContainer: HTMLDivElement;


	private randomString: string;

    private svg: SVGGraphicsElement;
	private svgElement: any;
	private transform: SVGTransform | null;
	private offsetX: number = 0;
	private offsetY: number = 0;
	private x1: number;
	private x2: number;
	private y1: number;
	private y2: number;
	private line: SVGLineElement | null;
	private rect: SVGRectElement | null;
	private circle: SVGCircleElement | null;
	private vbox: number[];

	private _MeasureMode: string;
	private _useFill: boolean;
	private _showDebug: boolean;
	private _reload: boolean;
	private _firstload: boolean;
	private fill: string;
	private fillSelected: string;

	//id of selected svg-object goes in here
	private _value: string;
	private _hover: string;
	private _clicktype: string;
	private _key: string;

	private _width: number;
	private _height: number;

	/*Mode of the PCF? Adds the required event listeners
	none - just view the SVG, cause things like title-tags and css work in here
	1point - click anywhere on the SVG and it returns coordinates in SVG coordinate system
	2points - click and drag on ths SVG and it returns coordinates of starting an end point
	select - select objects that have the class "selectableObject" - returns ID of the object
	drag - drag objects that have the class "draggableObject" - returns ID of the object returns translate x/y coordinates of starting an end point
	*/
	private _operationMode: string | null;


	private _notifyOutputChanged: () => void;
	/**
	 * Empty constructor.
	 */
	constructor()
	{

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{
		// Add control initialization code

		//load svg in any case on first load
		this._firstload = true;

		//Generate random string to prefix dom elements
		this.randomString = Random.newString();

		// Need to track container resize so that control could get the available width. The available height won't be provided even this is true
		context.mode.trackContainerResize(true);

		// Create main container div. 
		this.mainContainer = document.createElement("div");
		this.mainContainer.classList.add("main-container");
	
		// Create svg container div and append to main container. 
		this.svgContainer = document.createElement("div");
		this.mainContainer.classList.add("svg-container");
		this.svgContainer.setAttribute("id", this.randomString + "svg-container");

		// Adding the main container to the container DIV.
		this.mainContainer.appendChild(this.svgContainer);
		container.appendChild(this.mainContainer);

		// Create debug label
		this.debugSpan = document.createElement("span");
		this.debugSpan.classList.add("debug");
		this.mainContainer.appendChild(this.debugSpan);
		container.appendChild(this.mainContainer);

		
		this._notifyOutputChanged = notifyOutputChanged;
	}


	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{

		this._value = context.parameters.selectedID.raw!;
		this._width = context.parameters.svgWidth.raw!;
		this._height = context.parameters.svgHeight.raw!;

		this.svgContainer.style.height = this._height.toString()+"px";
		this.svgContainer.style.width = this._width.toString()+"px";

		// Add code to update control view
		this.contextObj = context;

		// Empty Debug Message
		this.updateDebug(this.debugSpan.innerHTML);

		// Reload SVG on every update?
		if(this.contextObj.parameters.reloadSVG != null){
			this._reload = (this.contextObj.parameters.reloadSVG.raw != 'no');		
		}

		// Set SVG content
		if(this._reload || this._firstload) {
		if(this.contextObj.parameters.svg != null){
			if(this.contextObj.parameters.svg.raw != null) {
				this.svgContainer.innerHTML = this.contextObj.parameters.svg.raw.toString();
				this.initSVG();
			}		
		}
		}

		//first load is over
		this._firstload = false;

		// Set operation Mode
		if(this.contextObj.parameters.operationMode != null){
			this._operationMode = this.contextObj.parameters.operationMode.raw;		
		}

		// Show Debug message? Must be 'yes' to show message
		if(this.contextObj.parameters.showDebug != null){
			this._showDebug = (this.contextObj.parameters.showDebug.raw != 'no');		
		}

		// Determine if fill is used
		if(this.contextObj.parameters.useFill != null){
			this._useFill = (this.contextObj.parameters.useFill.raw != 'no');		
		}

		// Set measure mode
		if(this.contextObj.parameters.MeasureMode.raw != null) {
			this._MeasureMode = this.contextObj.parameters.MeasureMode.raw;	
		}

		// Set fill color
		if(this.contextObj.parameters.fill.raw != null) {
				this.fill = this.contextObj.parameters.fill.raw;
			}
			else {
				this.fill = 'lightgray';
			}		
		
		// Set selected fill color
		if(this.contextObj.parameters.fillSelected.raw != null) {
				this.fillSelected = this.contextObj.parameters.fillSelected.raw;
			}
			else {
				this.fillSelected = 'green';
			}	
		
		// Set selected fill color
		document.addEventListener("keydown", (e: KeyboardEvent) => {

				 this._key = e.key;
				 this.updateDebug('[pressedKey] ' + this._key)

				 if(this._operationMode == 'keypress') { this._notifyOutputChanged(); }
		})
		  
		

		//event listeners to return 1 point on click
		if(this._operationMode == '1point') {
			this.svg.addEventListener("click", this.getCoordinatesOnClick.bind(this));
		}

		//event listeners to return 2 points on drag
		if(this._operationMode == '2points') {
		this.svg.addEventListener("mousedown", this.startTwoPoints.bind(this));
		this.svg.addEventListener("mousemove", this.dragTwoPoints.bind(this));
		this.svg.addEventListener("mouseup", this.endTwoPoints.bind(this));
		}

		//event listenerfor dragging part of drag - needs to be on the whole svg, otherwise the mouse tends to lose focus on the object and it doesn't move anymore
		if(this._operationMode == 'drag') {
			this.svg.addEventListener("mousemove", this.drag.bind(this));
			}		

		// Operation Mode: "select" Find referenced SVG elements that are selectable, add event listener and set fill color

		if(this._operationMode == 'select' || this._operationMode == 'hover') {
			var svgObjCollection = document.getElementsByClassName('selectableObject');
			
			// Set fill color of found SVG elements
			for (let i = 0; i < svgObjCollection.length; i++) {
				let svgObj = <SVGElement>svgObjCollection[i];
				if(svgObj != null){
					
					if(svgObj.getAttribute("id") == this._value) {
						if(this._useFill) {
							svgObj.style.fill = this.fillSelected;
						}
					}
					else {
						if(this._useFill) {
							svgObj.style.fill = this.fill;
						}
					}

					// Add onclick event to SVG element
					svgObj.addEventListener("click", this.onElementClick.bind(this));
					svgObj.addEventListener("dblclick", this.onElementDblClick.bind(this));
					svgObj.addEventListener("contextmenu", this.onElementRightClick.bind(this));

					// hover sometimes leads to delays
					if(this._operationMode == 'hover') {
						svgObj.addEventListener("mousemove", this.onElementHover.bind(this)) 
					};

				}
			}
		}

		// Operation Mode: "drag" Find referenced SVG elements that are draggable, add event listener

		if(this._operationMode == 'drag') {
			var svgObjCollection = document.getElementsByClassName('draggableObject');

			// Set event listeners for dragging
			for (let i = 0; i < svgObjCollection.length; i++) {
				let svgObj = <SVGElement>svgObjCollection[i];
				if(svgObj != null){
					
					svgObj.addEventListener("mousedown", this.startDrag.bind(this));
					svgObj.addEventListener("mousemove", this.drag.bind(this)); //is bugy when mouse is too fast it loses the svg object
					svgObj.addEventListener("mouseup", this.endDrag.bind(this));
					//svgObj.addEventListener("mouseleave", this.endDrag.bind(this));
					
					//could be necessary for mobile use, touchmove doesn't work cause it's no mouse event
					/*
					svgObj.addEventListener('touchstart', this.startDrag.bind(this));
					//svgObj.addEventListener('touchmove', this.drag.bind(this));
					svgObj.addEventListener('touchend', this.endDrag.bind(this));
					svgObj.addEventListener('touchleave', this.endDrag.bind(this));
					svgObj.addEventListener('touchcancel', this.endDrag.bind(this));
					*/
				}
			}
		}
	}

	/**
   * Get pressed Keyboard Key
   * @param event
   
	 public getPressedKey(event: KeyboardEvent): void {

		this._key = event.key;
		this.updateDebug('[pressedKey] ' + this._key);

		this._notifyOutputChanged();
		}*/

	/**
   * Click Event handler for the associated svg-object when being clicked
   * @param event
   */
	public onElementClick(event: Event): void {

		// Set all Elements to fill color (reset the selected one)
		var svgObjCollection = document.getElementsByClassName('selectableObject');
		for (let i = 0; i < svgObjCollection.length; i++) {
			let svgObj = <SVGElement>svgObjCollection[i];
			if(svgObj != null){
				if(this._useFill) {	
					svgObj.style.fill = this.fill;
				}
			}
		}

		//Clicked Element selectedFill color
		let elementPath = (event.currentTarget as HTMLDivElement);
		let elementRecordId = (event.currentTarget as HTMLDivElement).getAttribute("id");			

		if(elementRecordId != null) {
			if(this._useFill) {
			elementPath.style.fill = this.fillSelected;
			}
			this._value = elementRecordId;
			this._clicktype = 'single';

			this.updateDebug('[select] ID: ' + this._value);

			this.textToClipboard(this._value);
	

			this._notifyOutputChanged();
		}
	}

	//copy to clipboard functionality
	public textToClipboard (text: string) {
		var dummy = document.createElement("textarea");
		document.body.appendChild(dummy);
		dummy.value = text;
		dummy.select();
		document.execCommand("copy");
		document.body.removeChild(dummy);
}

/**
   * Mouseover Event handler for the associated svg-object when being hovered
   * @param event
   */
	public onElementHover(event: MouseEvent): void {

		let elementRecordId = (event.currentTarget as HTMLDivElement).getAttribute("id");			

		if(elementRecordId != null) {

			this._hover = elementRecordId;

			var coord = this.getMousePosition(event);
			this.x1 = coord.x;
			this.y1 = coord.y;

			this.updateDebug('[select] ID: ' + this._value + '[hover] ID: ' + this._hover + ' - x1: ' + this.x1.toFixed(1) + '- y1: ' + this.y1.toFixed(1));

			this._notifyOutputChanged();
		}
	}
	
/**
   * Doubleclick Event handler for the associated svg-object when being doubleclicked
   * @param event
   */
 public onElementDblClick(event: MouseEvent): void {

	let elementRecordId = (event.currentTarget as HTMLDivElement).getAttribute("id");			

	if(elementRecordId != null) {

		this._value = elementRecordId;
		this._clicktype = 'double';

		this.updateDebug('[Select] ID: ' + this._value + ' DOUBLECLICK');

		this._notifyOutputChanged();
	}
}

/**
   * Rightclick Event handler for the associated svg-object when being doubleclicked
   * @param event
   */
 public onElementRightClick(event: MouseEvent): void {

	let elementRecordId = (event.currentTarget as HTMLDivElement).getAttribute("id");			

	if(elementRecordId != null) {

		this._value = elementRecordId;
		this._clicktype = 'right';

		this.updateDebug('[Select] ID: ' + this._value + ' RIGHTCLICK');

		this._notifyOutputChanged();
	}
}	

	/**
   * Event functions for the associated svg-object when being dragged
   * @param event
   */	

	public startDrag(event: MouseEvent): void {
		this.svgElement = event.currentTarget;
		this._value = this.svgElement.getAttribute("id");

		//var bbox = this.svgElement.getBBox(); BBox wurde nicht gebraucht

		//get transforms - first transform needs to be a translate
		var transforms = this.svgElement.transform.baseVal;
		this.transform = transforms.getItem(0);

		//calculate offset from clicked point to edge of SVG object
		var coord = this.getMousePosition(event);
		this.offsetX = coord.x  - this.transform!.matrix.e;
		this.offsetY = coord.y  - this.transform!.matrix.f;

		this.x1 = this.offsetX + coord.x;
		this.y1 = this.offsetY + coord.y;
	}

	public drag(event: MouseEvent): void {
		
		event.preventDefault();
		var coord = this.getMousePosition(event);

		this.x2 = Math.min(coord.x - this.offsetX, this.vbox[2] - this.vbox[0] - this.offsetX);
		this.y2 = Math.min(coord.y - this.offsetY, this.vbox[3] - this.vbox[1] - this.offsetY);

		//write Coordinates to translate transform of SVG element
		this.transform!.setTranslate(this.x2, this.y2);

		this.updateDebug('[drag] ID: ' + this._value + ' - x1: ' + this.x1.toFixed(1) + '- y1: ' + this.y1.toFixed(1) + ' - x2: ' + this.x2.toFixed(1) + '- y2: ' + this.y2.toFixed(1) );
		
	}

	public endDrag(event: Event): void {
		this.svgElement = null;
		this.transform = null;
		this._notifyOutputChanged();
	}

	//When you don't select an object, but want to get two points mousedown - drag - mouseup

	public startTwoPoints(event: MouseEvent): void {
		var coord = this.getMousePosition(event);
		this.x1 = coord.x;
		this.y1 = coord.y;

		if(this._MeasureMode == 'line') {
		this.line = document.createElementNS('http://www.w3.org/2000/svg','line');
		this.line.setAttribute('id','measureline');
		this.line.setAttribute('x1', coord.x.toString());
		this.line.setAttribute('y1', coord.y.toString());
		this.line.setAttribute('x2', coord.x.toString());
		this.line.setAttribute('y2', coord.y.toString());
		this.line.setAttribute("stroke", 'gray')
		this.svg.append(this.line);

		} else if(this._MeasureMode == 'rect') {
		this.rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
		this.rect.setAttribute('id','measurerect');
		this.rect.setAttribute('x', coord.x.toString());
		this.rect.setAttribute('y', coord.y.toString());
		this.rect.setAttribute('width', '0');
		this.rect.setAttribute('height', '0');
		this.rect.setAttribute("stroke", 'gray');
		this.rect.setAttribute("fill", '#aaaaaaaa')
		this.svg.append(this.rect);
		} else if(this._MeasureMode == 'circle') {
		this.circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
		this.circle.setAttribute('id','measurecircle');
		this.circle.setAttribute('cx', coord.x.toString());
		this.circle.setAttribute('cy', coord.y.toString());
		this.circle.setAttribute('r', '0');
		this.circle.setAttribute("stroke", 'gray');
		this.circle.setAttribute("fill", '#aaaaaaaa')
		this.svg.append(this.circle);
		}
	}

	public dragTwoPoints(event: MouseEvent): void {
		var coord = this.getMousePosition(event);
		this.x2 = coord.x;
		this.y2 = coord.y;
		this.line?.setAttribute('x2',coord.x.toString());
		this.line?.setAttribute('y2',coord.y.toString());
		this.rect?.setAttribute('width', (this.x2-this.x1).toString());
		this.rect?.setAttribute('height', (this.y2-this.y1).toString());
		this.circle?.setAttribute('r', Math.sqrt(Math.pow(this.x2-this.x1, 2) + Math.pow(this.y2-this.y1, 2)).toString());

		this.updateDebug('[2Points]: x1: ' + this.x1.toFixed(1) + '- y1: ' + this.y1.toFixed(1) + 'x2: ' + this.x2.toFixed(1) + '- y2: ' + this.y2.toFixed(1));
	}

	public endTwoPoints(event: Event): void {
		this.line?.remove();
		this.line = null;

		this.rect?.remove();
		this.rect = null;

		this.circle?.remove();
		this.circle = null;

		this._notifyOutputChanged();
	}

	// Get Mouse Position and Transform to SVG
	public getMousePosition(event: MouseEvent) {
		var CTM = this.svg.getScreenCTM();

		return {
		  x: (event.clientX - CTM!.e) / CTM!.a,
		  y: (event.clientY - CTM!.f) / CTM!.d
		};
	  }

	public getCoordinatesOnClick(event: MouseEvent) {
		var coord = this.getMousePosition(event);
		this.x1 = coord.x;
		this.y1 = coord.y;
		this.updateDebug('[1point] x: ' + coord.x.toFixed(1) + '- y: ' + coord.y.toFixed(1));
		this._notifyOutputChanged();
	}
	

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {
			selectedID: this._value,
			hoverID: this._hover,
			clickType: this._clicktype,
			x1: this.x1,
			x2: this.x2,
			y1: this.y1,
			y2: this.y2,
			key: this._key
		};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary

	}

	// Initialize SVG 
	private initSVG():void 
	{

		let _svgElement = document.querySelector("#" + this.randomString + "svg-container svg");
		if(_svgElement != null)
		{
			// The main SVG object
			this.svg = _svgElement as SVGGraphicsElement;

		this.vbox = [0, 0, 0, 0];

			// The main SVG object and its current viewBox
			this.svg = _svgElement as SVGGraphicsElement;

			// Parse the viewBox properties
			let _viewbox = this.svg.getAttribute('viewBox');
			if(_viewbox != null) {
				let _vbox = _viewbox.split(' ');
				this.vbox[0] = parseFloat(_vbox[0]);
				this.vbox[1] = parseFloat(_vbox[1]);
				this.vbox[2] = parseFloat(_vbox[2]);
				this.vbox[3] = parseFloat(_vbox[3]);
			}
		}

    }

	private updateDebug(debugString: string): void {
		if(this._showDebug) {this.debugSpan.innerHTML = debugString;} else {this.debugSpan.innerHTML = ' '}
	}
	
}

// Generate random string
class Random {
	static newString() {
	  return 'axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0,
		  v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
	}
  }