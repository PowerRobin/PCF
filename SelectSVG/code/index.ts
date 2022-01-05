import {IInputs, IOutputs} from "./generated/ManifestTypes";

const elemRecordId: string = "elemRecId";


export class SelectSVG implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	// Cached context object for the latest updateView
	private contextObj: ComponentFramework.Context<IInputs>;

	// Div element created as part of this control's main container
	private mainContainer: HTMLDivElement;

	// Image element created as part of this control's table
	private svgContainer: HTMLDivElement;


	private randomString: string;

    private svg: SVGGraphicsElement;

	private _useFill: boolean;
	private fill: string;
	private fillSelected: string;

	//id of selected svg-object goes in here
	private _value: string;

	private _width: number;
	private _height: number;

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
		container.appendChild(this.svgContainer);
		
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

		this.svgContainer.style.position = 'relative';
		this.svgContainer.style.height = this._height.toString()+"px";
		this.svgContainer.style.width = this._width.toString()+"px";

		// Add code to update control view
		this.contextObj = context;

		// Set SVG content
		if(this.contextObj.parameters.svg != null){
			if(this.contextObj.parameters.svg.raw != null) {
				this.svgContainer.innerHTML = this.contextObj.parameters.svg.raw.toString();
				this.initSVG();
			}		
		}

		// Determine if fill is used
		if(this.contextObj.parameters.useFill != null){
			this._useFill = (this.contextObj.parameters.useFill.raw != 'no');		
		}

		// Set fill color
		if(this.contextObj.parameters.fill != null){
			if(this.contextObj.parameters.fill.raw != null) {
				this.fill = this.contextObj.parameters.fill.raw;
			}
			else {
				this.fill = 'lightgray';
			}		
		}
		
		// Set selected fill color
		if(this.contextObj.parameters.fillSelected != null){
			if(this.contextObj.parameters.fillSelected.raw != null) {
				this.fillSelected = this.contextObj.parameters.fillSelected.raw;
			}
			else {
				this.fillSelected = 'green';
			}	
		}

		// Find referenced SVG elements
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

			}
		}		
	}

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
			console.log('selektierte ID ${elementRecordId}');
			this._notifyOutputChanged();
			
		}


	}
	

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {
			selectedID: this._value
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
	// Need the viewbox properties to facilitate zoom functionality
	private initSVG():void 
	{

		let _svgElement = document.querySelector("#" + this.randomString + "svg-container svg");
		if(_svgElement != null)
		{
			// The main SVG object
			this.svg = _svgElement as SVGGraphicsElement;

		}
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