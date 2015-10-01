

  
  ////////////////////////////////
  ////////////////////////////////  
  // Global variables
  ////////////////////////////////
  ////////////////////////////////

  // I followed Mike Bostock's margin convention to set margins first, 
  // and then set the width and height based on margins.
  // Here's the link to the margin convention 
  // http://bl.ocks.org/mbostock/3019563

  var margin = {top: 30, right: 30, bottom: 30, left: 30},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom


  // This is the projection for the flat map
  // var projection = d3.geo.mercator()
  //   // .center([121.0, 23.5])
  //   .translate([width / 2, height / 1.5])
  //   .scale(125); // feel free to tweak the number for scale and see the changes

  //This is the project for the globe 
  var projection = d3.geo.orthographic()
      .scale(height / 2)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(0.5);

  var path = d3.geo.path()
    .projection(projection)
    .pointRadius(function(d) {
        //This is where we set circle radii to show count of attendees
        if (d.count) {
            return Math.sqrt(d.count / Math.PI) * 1.3;
        }
    });

  var voronoi = d3.geom.voronoi()
    .x(function(d) {
        return d.x;
    })
    .y(function(d) {
        return d.y;
    })
    .clipExtent([
        [0, 0],
        [width, height]
    ]);

  var svg = d3.select('#map').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('class', 'graph-svg-component')
    .call(responsivefy) // Call function responsivefy to make the graphic reponsive according to the window width/height
    .append('g')
    .attr("class", "globe-g")
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var globe = svg.selectAll('path.globe').data([{
        type: 'Sphere'
    }])
    .enter().append('path')
    .attr('class', 'globe')
    .attr('d', path);


  ////////////////////////////////
  ////////////////////////////////  
  // Queue: queue is an asynchronous helper library for JavaScrip 
  // It helps coders to easily load multiple datasets 
  // Here's the link to queue github repository:
  // https://github.com/mbostock/queue
  ////////////////////////////////
  ////////////////////////////////

  queue()
      .defer(d3.json, 'data/world_countries.json')// load geojson/topojson data
      .defer(d3.csv, 'data/exchange_student.csv')
      .defer(d3.csv, 'data/data_school - Sheet1.csv')
      // .defer(d3.csv, 'data/data_school.csv')
      .await(ready);


  function ready(error, world, data) {
    if (error) throw error;

    // data.forEach(
    //   function(d){
    //     d.end_lat = +d.end_lat;
    //     d.end_long = +d.end_long;
    //     d.start_lat = +d.start_lat;
    //     d.start_long = +d.start_long;

    //     d.count = + d.count;

    //     d.greatcircle = new arc.GreatCircle({x:d.start_long, y:d.start_lat}, {x:d.end_long, y:d.end_lat});
    //     d.line = d.greatcircle.Arc(100, {offset:10});
    //     d.arc = d.line.json();

    //   }
    // );

    data.forEach(
        function(d) {

            // var latlong = d.lat_long.replace(/\"/g, "").replace(/\'/g, "").split(",");
            // var latlong = [+latlong[0], +latlong[1]];

             d.end_lat = +d.end_lat;
             d.end_long = +d.end_long;
             d.start_lat = +d.start_lat;
             d.start_long = +d.start_long;

             d.greatcircle = new arc.GreatCircle({
                    x: d.start_long,
                    y: d.start_lat
                }, {
                    x: d.end_long,
                    y: d.end_lat
                });
                d.line = d.greatcircle.Arc(100, {
                    offset: 10
                });
                d.arc = d.line.json();
              }
     );

    data = data.filter(function(d) {
        if (isNaN(d.end_lat) || isNaN(d.end_long)) {
            //Do nothing.
        } else {
            return d;
        }
    });

    svg.selectAll('baseMap')
        .data(world.features)
        .enter()
        .append('path')
        .attr('d', path)
    // .append("g")
    .attr('class', 'baseMap');

    svg.selectAll('.cities_end')
        .data(data)
        .enter().append("path")
        .datum(function(d) {
            return {
                type: "Point",
                coordinates: [d.end_long, d.end_lat],
                count: +d.count
            };
        })
        .attr("d", path)
        .attr('class', 'cities_end');

    svg.append("g")
        .attr("class", "line")
        .selectAll(".arc")
        .data(data.map(function(d) {
            return d.arc;
        }))
        .enter()
        .append("path")
        .attr("class", "arc")
        .attr("d", path);

   
    

 
  }

  d3.select("svg").call( //drag on the svg element
    d3.behavior.drag()
    .origin(function() {
        var r = projection.rotate();
        return {
            x: r[0],
            y: -r[1]
        }; //starting point
    })
    .on("drag", function() {
        var r = projection.rotate();
        /* update retation angle */
        projection.rotate([d3.event.x, -d3.event.y, r[2]]);

        /* redraw the map and circles after rotation */
        svg.selectAll(".baseMap").attr("d", path);
        svg.selectAll(".arc").attr("d", path);
        svg.selectAll('.cities_end')
            .attr("d", path);

        $(".reset-btn").removeClass("disabled");
    })
);


    function responsivefy(svg) {
      var container = d3.select(svg.node().parentNode),
          width = parseInt(svg.style('width')),
          height = parseInt(svg.style('height')),
          aspect = width / height;

      svg.attr('viewBox', '0 0 ' + width + ' ' + height)
          .attr('perserveAspectRatio', 'xMinYMid')
          .call(resize);

      d3.select(window).on('resize', resize);

      function resize() {
          var targetWidth = parseInt(container.style('width'));
          svg.attr('width', targetWidth);
          svg.attr('height', Math.round(targetWidth / aspect));
      }
    }
