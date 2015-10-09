## Table Of Contents

- [Overview](#overview)
- [Getting Started w/ Grunt](#getting-started-w-grunt)
- [Getting Started w/ Python SimpleHTTPServer](#getting-started-w-python-simplehttpserver)
- [Optimizations for Cam's Pizzeria](#optimizations-for-cams-pizzeria)

### Overview
The project challenged students to take on two tasks:

1. Optimize the __portfolio page__ (index.html) to receive a Google Page Speed Insights Score of 90 (or more) for __web__ _and_ __mobile__.
1. Optimize the __Cam's Pizzeria__ page (views/pizza.html) to run at __60FPS__ or more.

This was a very intriguing project because it caused me to spend a lot of time learning about performant practices in JavaScript. If interested, please do check out some of the following resources:

- [Critical Rendering Path Course at Udacity](https://www.udacity.com/course/ud884)
- [Google's Web Fundamentals - Optimizing Performance](https://developers.google.com/web/fundamentals/performance/index?hl=en)

### Getting Started w/ Grunt
This project uses [__Grunt__](http://gruntjs.com/) as a build system. Before running any of the build process, please [install Grunt first](http://gruntjs.com/getting-started). If you haven't, you'll need to [install NodeJs](https://nodejs.org/en/) first. Follow these steps if you want a full walk through of the process for building the project.

1. Check out this repository
1. Navigate to the downloaded repository and download the dependencies
```bash
$> cd /path/to/frontend-nanodegree-mobile-portfolio/
$> npm install
```

1. Build the project and start the server
```bash
$> grunt dist
```
This will build the project __and__ start a webserver availble at port 8081. Here's what you'll see from on the terminal:
```bash
Running "connect:server" (connect) task
Waiting forever...
Started connect web server on http://localhost:8081
```
This confirms, what the port will be for the server. Don't like this port? Want to use another? No problem!
```bash
$> grunt dist --port=your-port-here
```
The output of the build process is found in the ```dist``` directory.
1.  Open a browser and visit ```http://localhost:8081``` to get started

### Getting Started w/ Python SimpleHTTPServer
If you have ```python``` installed on your machine, you can boot this project very quickly as follows:

1. Download the repository
1. Start the webserver
```bash
$> cd /path/to/frontend-nanodegree-mobile-portfolio/dist
$> python -m SimpleHTTPServer 8000
```
1. Open a browser and visit ```http:localhost: 8000``` to get started

### Optimizations for Cam's Pizzeria Scrolling
#### Pizza Generation
In the event listener for ```DOMContentLoaded```, the code was updated to no longer arbitrarily create 200 pizzas for the background. That would result in 1 DOM node per pizza. To optimize this, the dimensions of the viewport are calculated and a grid of 6x6 pizzas is created. This way we aren't creating pizzas for space that won't even get rendered.

```js
var numRows = Math.ceil(window.innerHeight / s);
var numCols = Math.ceil(window.innerWidth / s);

// Use this nested loop to create rows of pizzas
// and create pizzas for the UI
for (var i =0; i < numRows; i++) {
  for (var j = 0; j < numCols; j++) {
    createPizza(i, j);
  }
}
```

The ```createPizza``` function helps with readability but not with any specific optimizations there. Another small change here is that at the end of this callback, we request update the positions of the pizzas during an animation frame provided by the browser.

#### Scrolling Animation
The scrolling animation iterates through the background pizzas and then based on a formula (sinusoidal phases) moves the pizzas laterally. This function had lots of changes to get the animation to be smooth and less costly.

##### Debouncing the scroll events
The first step was to not have the ```updatePositions``` function be called on ever event generated by the scroll listener. To accomplish this, the event listener calls a function to request an animation frame. If the frame is currently in the middle of processing the last call to ```updatePositions``` the additional call isn't made. Here's the code for that:

```js
// We register the event listener
window.addEventListener("scroll", requestFrame, false);

// When called, we only request an animationFrame IF we aren't in the middle of working on the last request
function requestFrame() {
    if (!isInFrame) {
        window.requestAnimationFrame(updatePositions);
        isInFrame = true;
        lastY =  window.scrollY;
    }
}
```
Now, we don't bombard the ```updatePositions``` function and we get a somewhat smoother experience. But we can do better.

#### Caching and re-using values
In the ```updatePositions``` function this are a few values that once were calculated on ever execution that won't change (or not likely to change) between executions. We make some changes to cache those values where appropriate:
```js
function updatePositions() {
  var distance;
  var phases = [];

  ...

  var pizzas = document.getElementsByClassName("mover");

  // Cache the phases, they only change based on the scroll distance
  for (var j = 0; j < 5; j++) {
    phases.push(Math.sin((lastY / 1250) + j));
  }
  ...
}
```
As can be see above in the line the phases are cached __before__ the values are used in an positioning lines of code. Remember ```lastY``` from the ```requestFrame``` function? Here's where we use it verses making calls to ```document.body.scrollTop``` and asking the browser to do layout related calculations. This actually saves us a layout step in the time line. But, as before, we can do better.

#### Transforms and Hinting
Updating the CSSOM from JavaScript is going to have a performance impact but we can make some changes to the way the pizzas are animated. The original code performed the moves via:

```js
var items = document.querySelectorAll('.mover');
for (var i = 0; i < items.length; i++) {
  ...
  items[i].style.left = items[i].basicLeft + 100 * phase + 'px';
                 ^^^^
}
```
This isn't wrong, but in a step to optimize we can use hardware accelerated 3d transforms and moving the pizzas to their own layers. One of the impacts this change has on the pipeline is that it transforms only invoke composite events ((learn more) [http://csstriggers.com/]). Another step was to hint to the browser that we'll be doing transformations. This may encourage the browser to do some optimizations by creating individual layers for the dom elements that are hinted to be adjusted this way. In the pizza creation we do it like this:

```js
var elem = document.createElement("img");
...
elem.style.willChange = "transform";
elem.style.transform = "translateZ(0)";
...
movingPizzas.appendChild(elem);
```

With the combined effort of caching layout calculating calls and 3d transforms, we're able to optimize the scroll animation to run as smooth as butter!

### Optimizations for Cam's Pizzeria Resize Pizzas
The optimizations for making the pizza resizing were smaller but are still worth taking the time to explore.

#### Removing Pixel Calculation
The original ```resizePizzas``` had a function named ```determineDx``` to help figure out what the new pixel size would be. It queried the the DOM for widths of elements which, as we've seen, can trigger layout calculations. The change here was to remove the function altogether and simple use the percentages returned from ```sizeSwitcher``` to get the new size.

```js
function changePizzaSizes(size) {
  ...
  for (var i = 0; i < numPizzaContainerElements; i++) {
    pizzaContainerList[i].style.width = (sizeSwitcher(size) * 100) + "%";
  }
}
```
There is still an update to the CSS but we can live with that. One optimization I considered here would have been to use Scale and not width.

#### Anything else?
Throughout the application there are small changes to things like which query selector is used and removing DOM querying from for loops wherever it made sense. Thanks for taking the time to read this this ```README``` - stay awesome!
