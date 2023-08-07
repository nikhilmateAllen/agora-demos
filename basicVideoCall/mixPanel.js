/* 
  Global mixpanel
*/
class MixPanel {
  constructor(){
    this._mixPanel = mixpanel.init("0ffb1d2f068153f2a6de3084bad3fadb", {
      debug: true,
      track_pageview: true,
    });
  }

  // grab the Mixpanel factory
  mixpanelIdentify(localPeerId){
    mixpanel.identify(localPeerId);
  }

  sendEvent(eventName, eventData) {
    console.log("===> eventName ===>", eventName);
    console.log(eventData);
    console.log("===> ===> ===>");
    mixpanel.track(eventName, eventData);
  }
}