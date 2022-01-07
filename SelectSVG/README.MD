Steps to use the PCF in your PowerApps-Projects

If you have any questions feel free to contact me through YT-comments or via linkedin: https://www.linkedin.com/in/robin-rosengr%C3%BCn-ab35091b6/

I explain everything in detail in a YouTube-video, probably you should check that out as well: https://www.youtube.com/watch?v=-jMQkVxKdoo
You can find the component as well at the PCF Gallery: https://pcf.gallery/select-svg/

The component is based on another component by Jens Christian Schrøder, which showed me how to load SVG code and get access to the different objects in the SVG code https://pcf.gallery/pcf-svg-control/

When you import the solution, you'll also find a Canvas App called "Select SVG demo" where you'll find some good examples how to use the component

1. Enable PCF-components in your environment in the Admin-center
2. Download the zip-file from the solution folder
3. Go to https://make.powerapps.com/ and navigate to "Solutions"
4. Select "Import" and choose the zip-file
5. In a Canvas App select Insert->Custom->Import component->Code->SelectSVG
   The component is now usable in the app but not yet on your screen
6. On the left navigation go to "Insert" (+ Icon directly underneath "Tree view")
7. Expand "Code components" and add "SelectSVG"

WARNING: The component doesn't work in your Canvas App Editor, but will work in the published version.

Properties of the component

svg_code: Here goes the SVG-code you want to display. Every object that you want to be selectable needs to have the class "selectableObject". 
          This can also be a group of ojects. You also need to set the id attribute to a freely chosen string.
          The component then returns the id attribute if you click on it.

use_fill: Expects the string "yes" or "no" (everything else the "yes" results in "no"). If "yes" it will override the fill attribute of every
          svg-object with the class "selectableObject"
          
fill_color: color used to override the unselected objects (if use_fill set to "yes")

selectedFill_color: color used to override the selected objects (if use_fill set to "yes")

svg_width: width of the image in pixels (set to Self.Width)

svg_height: width of the image in pixels (set to Self.Height)

selectedID: string can be used as input or output
           As input: selects the svg object with the corresponding id (best use would to put a variable in here that you can change in your app)
           As output: outputs the id of the selected object
