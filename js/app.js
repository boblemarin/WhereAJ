"use strict";

/////////////////////////////////////////////////////////////////////////////////////
// requestAnimationFrame polyfill
(function(){var lastTime=0;var vendors=['ms','moz','webkit','o'];for(var x=0;x<vendors.length&&!window.requestAnimationFrame;++x){window.requestAnimationFrame=window[vendors[x]+'RequestAnimationFrame'];window.cancelAnimationFrame=window[vendors[x]+'CancelAnimationFrame']||window[vendors[x]+'CancelRequestAnimationFrame'];}if(!window.requestAnimationFrame)window.requestAnimationFrame=function(callback,element){var currTime=new Date().getTime();var timeToCall=Math.max(0,16-(currTime-lastTime));var id=window.setTimeout(function(){callback(currTime+timeToCall);},timeToCall);lastTime=currTime+timeToCall;return id;};if(!window.cancelAnimationFrame)window.cancelAnimationFrame=function(id){clearTimeout(id);};}());

/////////////////////////////////////////////////////////////////////////////////////
// no-scroll touch fix
(function(els){
  var noScrollFn = function( e ) { e.preventDefault(); };
  Array.prototype.forEach.call( els, function(el,i){
    el.addEventListener( 'touchstart', noScrollFn );
  });
}(document.querySelectorAll( '.no-scroll' )));



/////////////////////////////////////////////////////////////////////////////////////
// Entry class
function Entry(){
  this.teacher = '';
  this.course = '';
  this.location = '';
  this.group = '';
  this.hour = 0;
  this.hourTo = 0;
}
Entry.prototype.populate = function(src){
  var t = dictionary.teachers['p'+src[0]].split(' ');
  t.reverse();
  this.teacher = t.join(' ');
  this.course = dictionary.courses['C'+src[1]];
  this.hour = Number(src[2]);
  this.hourTo = Number(src[3]);
  this.group = dictionary.groups['c'+src[4]];
  this.location = dictionary.locations['l'+src[5]];
  return this;
};
Entry.prototype.render = function(){
  var o = '<li>';
  o += '<span class="location">'+this.location+'</span>';
  o += '<span class="teacher">'+this.teacher+'</span>';
  //o += '<span class="group">'+this.group+'</span>';
  o += '</li>';
  return o;
  //'<li><b>' + entry.location + '</b> : ' + entry.teacher + ', ' + entry.course + ', ' + entry.group + '</li>';
};
function EntryFactory(src){
  return (new Entry()).populate(src);
}

/////////////////////////////////////////////////////////////////////////////////////
// Main app

var 
  dictionary,
  entries = [],
  periods = [8.666,9.666,10.833,11.833,12.833,13.833,14.833,16,17,18,19],
  currentHour = 1,
  results = document.querySelector("ul.results");

function init(data){
  if ( data.status === 'OK' ) {
    // collect dictionaries
    dictionary = {
      'groups': data.classes,
      'courses': data.courses,
      'locations': data.locations,
      'teachers': data.profs,
    }
    
    // convert raw data to Entry instances
    _.each(data.timetable, function(e){ entries.push( EntryFactory(e) ); });

    // display first results
    filterResults();
  } else {
    // show alert on api error
    alert(data.status);
  }
  
}

function filterResults() {
  // find correct entries
  var validEntries = _.where(entries,{hour:currentHour});

  // sort by classroom
  validEntries = _.sortBy(validEntries,'location');

  // temporary remove dupcliates
  // TODO: group teachers by classroom
  validEntries = _.uniq( validEntries, true, function(e){ return e.location + e.teacher; });

  // display
  results.innerHTML = _.reduce(validEntries, function(memo,entry){
    return memo + entry.render();
  }, '');

}