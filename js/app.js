"use strict";

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
// requestAnimationFrame polyfill -- by Paul Irish https://gist.github.com/paulirish/1579671
/////////////////////////////////////////////////////////////////////////////////////

(function(){var lastTime=0;var vendors=['ms','moz','webkit','o'];for(var x=0;x<vendors.length&&!window.requestAnimationFrame;++x){window.requestAnimationFrame=window[vendors[x]+'RequestAnimationFrame'];window.cancelAnimationFrame=window[vendors[x]+'CancelAnimationFrame']||window[vendors[x]+'CancelRequestAnimationFrame'];}if(!window.requestAnimationFrame)window.requestAnimationFrame=function(callback,element){var currTime=new Date().getTime();var timeToCall=Math.max(0,16-(currTime-lastTime));var id=window.setTimeout(function(){callback(currTime+timeToCall);},timeToCall);lastTime=currTime+timeToCall;return id;};if(!window.cancelAnimationFrame)window.cancelAnimationFrame=function(id){clearTimeout(id);};}());



/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
// no-scroll touch fix
/////////////////////////////////////////////////////////////////////////////////////

(function(els){
  var noScrollFn = function( e ) { e.preventDefault(); };
  Array.prototype.forEach.call( els, function(el,i){
    el.addEventListener( 'touchmove', noScrollFn );
  });
}(document.querySelectorAll( '.no-scroll' )));



/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
// Entry class
/////////////////////////////////////////////////////////////////////////////////////

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
  t.unshift( t.pop() );
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
/////////////////////////////////////////////////////////////////////////////////////
// Group class
/////////////////////////////////////////////////////////////////////////////////////

function Group(entry){
  this.entries = [entry];
  this.teachers = [entry.teacher];
  this.course = entry.course;
  this.location = entry.location;
  this.groups = [entry.group];
  this.hour = entry.hour;
  this.hourTo = entry.hourTo;
}

Group.prototype.add = function(entry){
  this.entries.push(entry);
  if ( this.teachers.indexOf(entry.teacher)<0 ) this.teachers.push(entry.teacher);
  if ( this.groups.indexOf(entry.group)<0 ) this.groups.push(entry.group);
}

Group.prototype.render = function(index){
  var o = '<li data-group-id="'+index+'">';
  o += '<span class="location">'+this.location+'</span>';
  o += '<span class="teacher">'+this.teachers.join('<br>')+'</span>';
  o += '<span class="hour-to">-&gt; '+periodLabels[this.hourTo]+'</span>';
  //o += '<span class="group">'+this.group+'</span>';
  o += '</li>';
  return o;
  //'<li><b>' + entry.location + '</b> : ' + entry.teacher + ', ' + entry.course + ', ' + entry.group + '</li>';
};

Group.prototype.renderFull = function(index){
  var o = '';
  o += '<span class="location">'+this.location+'</span>';
  o += '<span class="teacher">'+this.teachers.join('<br>')+'</span>';
  o += '<span class="course">'+this.course+'</span>';
  o += '<span class="groups">'+this.groups.join(' . ')+'</span>';
  o += '<span class="hour-from-to">de '+periodLabels[this.hour-1]+' à '+periodLabels[this.hourTo]+'</span>';
  //o += '<span class="group">'+this.group+'</span>';
  o += '</li>';
  return o;
  //'<li><b>' + entry.location + '</b> : ' + entry.teacher + ', ' + entry.course + ', ' + entry.group + '</li>';
};


/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
// Main app
/////////////////////////////////////////////////////////////////////////////////////
var 
  dictionary,
  entries = [],
  periods = [8.666,9.666,10.833,11.833,12.833,13.833,14.833,16,17,18,19],
  periodLabels = ['8h40','9h40','10h50','11h50','12h50','13h50','14h50','16h00','17h00','18h00','19h00'],
  currentPeriod = 1,
  touch = {x:0,y:0},
  results = document.querySelector("ul.results"),
  details = document.querySelector("section.details"),
  groups;

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

    addListeners()
  } else {
    // show alert on api error
    alert(data.status);
  }
  
}

function addListeners(){
  results.addEventListener('touchstart',onTouchStart);
  //results.addEventListener('touchmove',onTouchMove);
  results.addEventListener('touchend',onTouchEnd);
  details.addEventListener('touchstart',onDetailsTouchStart);
}

function onDetailsTouchStart(e){
  //e.preventDefault();
  details.classList.remove("visible");
}

function onTouchStart(e){
  touch.x = e.changedTouches[0].pageX;
  touch.y = e.changedTouches[0].pageY;
}

function onTouchEnd(e){
  touch.x -= e.changedTouches[0].pageX;
  touch.y -= e.changedTouches[0].pageY;
  if ( Math.sqrt(touch.x*touch.x+touch.y*touch.y)< 5 ) {
    //e.target.classList.toggle("selected");
    details.innerHTML = groups[e.target.dataset.groupId].renderFull();
    details.classList.add("visible");
  }
  //e.target.classList.remove("selected");

}

function filterResults() {
  // find correct entries
  var validEntries = _.where(entries,{hour:currentPeriod});

  // sort by classroom
  validEntries = _.sortBy(validEntries,'location');

  // temporary remove dupcliates
  // TODO: group teachers by classroom
  //validEntries = _.uniq( validEntries, true, function(e){ return e.location + e.teacher; });

  groups = [];
  _.each(validEntries,function(element, index, list){
    if ( index===0 || list[index-1].location != list[index].location ) {
      groups.push( new Group(list[index]) );
    } else {
      _.last(groups).add(list[index]);
    }
  });

  // display
  results.innerHTML = _.reduce(groups, function(memo,group,index){
    return memo + group.render(index);
  }, '');

}