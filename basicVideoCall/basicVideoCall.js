/*
 *  These procedures use Agora Video Call SDK for Web to enable local and remote
 *  users to join and leave a Video Call channel managed by Agora Platform.
 */

/*
 *  Create an {@link https://docs.agora.io/en/Video/API%20Reference/web_ng/interfaces/iagorartcclient.html|AgoraRTCClient} instance.
 *
 * @param {string} mode - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/clientconfig.html#mode| streaming algorithm} used by Agora SDK.
 * @param  {string} codec - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/clientconfig.html#codec| client codec} used by the browser.
 */
var client = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8"
});

/*
 * Clear the video and audio tracks used by `client` on initiation.
 */
var localTracks = {
  videoTrack: null,
  audioTrack: null
};

/*
 * On initiation no users are connected.
 */
var remoteUsers = {};
var isHighRemoteVideoQuality = true;
var userType = null
var cams, mics
var currentCamera = null, currentMic = null

/*
 * On initiation. `client` is not attached to any project or channel for any specific user.
 */
var options = {
  appid: null,
  channel: null,
  uid: null,
  token: null
};

// you can find all the agora preset video profiles here https://docs.agora.io/en/Voice/API%20Reference/web_ng/globals.html#videoencoderconfigurationpreset
var videoProfiles = [{
  label: "360p_7",
  detail: "480×360, 15fps, 320Kbps",
  value: "360p_7"
}, {
  label: "360p_8",
  detail: "480×360, 30fps, 490Kbps",
  value: "360p_8"
}, {
  label: "480p_1",
  detail: "640×480, 15fps, 500Kbps",
  value: "480p_1"
}, {
  label: "480p_2",
  detail: "640×480, 30fps, 1000Kbps",
  value: "480p_2"
}, {
  label: "720p_1",
  detail: "1280×720, 15fps, 1130Kbps",
  value: "720p_1"
}, {
  label: "720p_2",
  detail: "1280×720, 30fps, 2000Kbps",
  value: "720p_2"
}, {
  label: "1080p_1",
  detail: "1920×1080, 15fps, 2080Kbps",
  value: "1080p_1"
}, {
  label: "1080p_2",
  detail: "1920×1080, 30fps, 3000Kbps",
  value: "1080p_2"
}];
var curVideoProfile;

var mixPanel = new MixPanel();
var mixPanelTimer = null;

AgoraRTC.onAutoplayFailed = () => {
  alert("click to start autoplay!");
};
AgoraRTC.onMicrophoneChanged = async changedDevice => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.audioTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (changedDevice.device.label === localTracks.audioTrack.getTrackLabel()) {
    const oldMicrophones = await AgoraRTC.getMicrophones();
    oldMicrophones[0] && localTracks.audioTrack.setDevice(oldMicrophones[0].deviceId);
  }
};
AgoraRTC.onCameraChanged = async changedDevice => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.videoTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (changedDevice.device.label === localTracks.videoTrack.getTrackLabel()) {
    const oldCameras = await AgoraRTC.getCameras();
    oldCameras[0] && localTracks.videoTrack.setDevice(oldCameras[0].deviceId);
  }
};
async function initDevices() {
  // if (!localTracks.audioTrack) {
  //   localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
  //     encoderConfig: "music_standard"
  //   });
  // }
  // if (!localTracks.videoTrack) {
  //   localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack({
  //     encoderConfig: curVideoProfile.value
  //   });
  // }
  // get mics
  mics = await AgoraRTC.getMicrophones();
  // const audioTrackLabel = localTracks.audioTrack.getTrackLabel();
  // currentMic = mics.find(item => item.label === audioTrackLabel);
  if(Array.isArray(mics) && mics.length) {
    currentMic = mics[0];
    $(".mic-input").val(currentMic.label);
    $(".mic-list").empty();
    mics.forEach(mic => {
      $(".mic-list").append(`<a class="dropdown-item" data-id="${mic.deviceId}" href="#">${mic.label}</a>`);
    });
  }

  // get cameras
  cams = await AgoraRTC.getCameras();
  // const videoTrackLabel = localTracks.videoTrack.getTrackLabel();
  // currentCam = cams.find(item => item.label === videoTrackLabel);
  if(Array.isArray(cams) && cams.length) {
    currentCamera = cams[0]
    $(".cam-input").val(currentCamera.label);
    $(".cam-list").empty();
    cams.forEach(cam => {
      $(".cam-list").append(`<a class="dropdown-item" data-id="${cam.deviceId}" href="#">${cam.label}</a>`);
    });
  }
}
async function switchCamera(id) {
  currentCamera = cams.find(cam => cam.deviceId === id);
  $(".cam-input").val(currentCamera.label);
  // switch device of local video track.
  // await localTracks.videoTrack.setDevice(currentCam.deviceId);
}
async function switchMicrophone(id) {
  currentMic = mics.find(mic => mic.deviceId === id);
  $(".mic-input").val(currentMic.label);
  // switch device of local audio track.
  // await localTracks.audioTrack.setDevice(currentMic.deviceId);
}
function initVideoProfiles() {
  videoProfiles.forEach(profile => {
    $(".profile-list").append(`<a class="dropdown-item" label="${profile.label}" href="#">${profile.label}: ${profile.detail}</a>`);
  });
  curVideoProfile = videoProfiles.find(item => item.label == '720p_2');
  $(".profile-input").val(`${curVideoProfile.detail}`);
}
async function changeVideoProfile(label) {
  curVideoProfile = videoProfiles.find(profile => profile.label === label);
  $(".profile-input").val(`${curVideoProfile.detail}`);
  // change the local video track`s encoder configuration
  localTracks.videoTrack && (await localTracks.videoTrack.setEncoderConfiguration(curVideoProfile.value));
}

/*
 * When this page is called with parameters in the URL, this procedure
 * attempts to join a Video Call channel using those parameters.
 */
$(() => {
  initVideoProfiles();
  initDevices();
  $(".profile-list").delegate("a", "click", function (e) {
    changeVideoProfile(this.getAttribute("label"));
  });
  var urlParams = new URL(location.href).searchParams;
  options.appid = urlParams.get("appid");
  options.channel = urlParams.get("channel");
  options.token = atob(decodeURIComponent((urlParams.get("token"))));
  options.uid = urlParams.get("uid");
  if (options.appid && options.channel) {
    $("#uid").val(options.uid);
    $("#appid").val(options.appid);
    $("#token").val(options.token);
    $("#channel").val(options.channel);
    // $("#join-form").submit();
  }

  console.log('options::', options)

  document.getElementById('change-quality').addEventListener('click', async function (ev) 
  {
    if(isHighRemoteVideoQuality == false)
    {
        await client.setRemoteVideoStreamType(Number(Object.keys(remoteUsers)[0]), 0);
        isHighRemoteVideoQuality = true;
        ev.target.textContent = 'For student: Set Low Quality'
    }
    else
    {
        await client.setRemoteVideoStreamType(Number(Object.keys(remoteUsers)[0]), 1);
        isHighRemoteVideoQuality = false;
        ev.target.textContent = 'For student: Set High Quality'
    }
  });
});

/*
 * When a user clicks Join or Leave in the HTML form, this procedure gathers the information
 * entered in the form and calls join asynchronously. The UI is updated to match the options entered
 * by the user.
 */
$(".join-btn").click(async function (e) {
  const type = $(e.currentTarget).data('role')
  userType = type
  console.log(type)
  $('.join-btn').attr("disabled", true);
  try {
    options.channel = $("#channel").val();
    options.uid = Number($("#uid").val());
    options.appid = $("#appid").val();
    options.token = $("#token").val();
    await join(type);

    if(type === 'student') sendDataToMixPanel();

    if (options.token) {
      $("#success-alert-with-token").css("display", "block");
    } else {
      $("#success-alert a").attr("href", `index.html?appid=${options.appid}&channel=${options.channel}&token=${options.token}`);
      $("#success-alert").css("display", "block");
    }
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
  }
});

/*
 * Called when a user clicks Leave in order to exit a channel.
 */
$("#leave").click(function (e) {
  leave();
  stopCollectingStats();
});
$('#agora-collapse').on('show.bs.collapse	', function () {
  initDevices();
});
$(".cam-list").delegate("a", "click", function (e) {
  switchCamera($(this).data('id'));
});
$(".mic-list").delegate("a", "click", function (e) {
  // switchMicrophone(this.text);
  switchMicrophone($(this).data('id'));
});

/*
 * Join a channel, then create local video and audio tracks and publish them to the channel.
 */
async function join(type) {
  // Add an event listener to play remote tracks when remote user publishes.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  // client.on("network-quality", handleNetworkQuality)
  // Join the channel.
  
  client.setLowStreamParameter({
    framerate: { max: 30, min: 15 },
    width: { max: 640, min: 480 },
    height: { max: 480, min: 360 },
  })

  client.enableDualStream();
  
  options.uid = await client.join(options.appid, options.channel, options.token || null, options.uid || null);
  
  if(type === 'student' && typeof remoteUsers === 'object' && Object.keys(remoteUsers).length) {
    await client.setRemoteVideoStreamType(Object.keys(remoteUsers)[0], 1);
    $("#change-quality").text("For student: set high quality");
    isHighRemoteVideoQuality = false;  
  }
  
  if(type === 'teacher') {
    // Publish the local video and audio tracks to the channel.
    if (!localTracks.audioTrack) {
      localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "music_standard",
        microphoneId: currentMic.deviceId
      });
    }
    if (!localTracks.videoTrack) {
      localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: curVideoProfile.value,
        cameraId: currentCamera.deviceId
      });
    }

    await client.publish(Object.values(localTracks));
    console.log("publish success");
  }

  // Play the local video track to the local browser and update the UI with the user ID.
  // localTracks.videoTrack.play("local-player");
  // $("#local-player-name").text(`localVideo(${options.uid})`);
  // $("#joined-setup").css("display", "flex");
}

/*
 * Stop all local and remote tracks then leave the channel.
 */
async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  // Remove remote users and player views.
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();
  $("#local-player-name").text("");
  $(".join-btn").attr("disabled", false);
  $("#leave").attr("disabled", true);
  $("#joined-setup").css("display", "none");
  console.log("client leaves channel success");
  
  $("#change-quality").text("For student: set high quality");
  isHighRemoteVideoQuality = false;
  clearInterval(mixPanelTimer)
  userType = null
}

/*
 * Add the local use to a remote channel.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === "video") {
    const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
    $("#remote-playerlist").append(player);
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === "audio") {
    user.audioTrack.play();
  }
}

/*
 * Add a user who has subscribed to the live channel to the local interface.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

/*
 * Remove the user specified from the channel in the local interface.
 *
 * @param  {string} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to remove.
 */
function handleUserUnpublished(user, mediaType) {
  if (mediaType === "video") {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
  }
}
function getCodec() {
  var radios = document.getElementsByName("radios");
  var value;
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      value = radios[i].value;
    }
  }
  return value;
}

function stopCollectingStats() {
  clearInterval(mixPanelTimer)
}
function sendDataToMixPanel(){
  stopCollectingStats()
  mixPanelTimer=setInterval(() => {

    let remoteAudioStats = client.getRemoteAudioStats();
    let remoteVideoStats = client.getRemoteVideoStats();

    // let localAudioStats = client.getLocalAudioStats();
    // let localVideoStats = client.getLocalVideoStats();
    console.log('remoteVideoStats\n', remoteVideoStats)
    console.log('RTC\n', client.getRTCStats(), client.getRemoteNetworkQuality())
    
    Object.entries(remoteAudioStats).map(([key, value]) => {
      let audioData = { userid: key, local_user: options.uid, ...value }
      mixPanel.sendEvent('HOST_AUDIO_STATS', audioData);
    })

    Object.entries(remoteVideoStats).map(([key, value]) => {
      let videoData = { userid: key, local_user: options.uid, ...value }
      mixPanel.sendEvent('HOST_VIDEO_STATS', videoData);
    })
    
    // sendEvent('HOST_AUDIO_STATS', {...localAudioStats, user: options.uid});
    // sendEvent('HOST_VIDEO_STATS', {...localVideoStats, user: options.uid});
    mixPanel.sendEvent('HOST_AV_STATS', {...client.getRTCStats(), user: options.uid, netowrk: client.getRemoteNetworkQuality()});
    // // sendEvent('remote video stats', remoteVideoStats);
    // // sendEvent('remote audio stats', remoteAudioStats);
    client.on("exception", function(evt) {
      mixPanel.sendEvent('EXCEPTION', {code: evt.code, msg: evt.msg, uid: evt.uid})
      // console.log(evt.code, evt.msg, evt.uid);
    })
  }, 5000);
}