var util = require('../../utils/util.js');
var db_name = "student_location"

Page({
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于小程序位置接口的效果展示" // 高速公路行驶持续后台定位
    }
  },
  data: {
    openid: "",
    timer:"",
    start_time:"00:00",
    start_date:"2019-09-04",
    stop_time: "00:00",
    stop_date: "2019-09-04",
    longitude: 113.324520,
    latitude: 23.099994,
    speed:0,
    markers: [{
      latitude: 0,
      longitude: 0,
      width: 50,
      height: 50
    }],
    polyline: [{
      points: [],
      color: "#FF0000DD",
      width: 5,
      dottedLine: false
    }],
    controls: [{
      id: 1,
      iconPath: "/resources/others.png",
      position: {
        left: 0,
        top: 400,
        width: 50,
        height: 50
      },
      clickable: true
    }]
  },
  regionchange(e) {
    console.log(e,"regionchange")
  },
  markertap(e) {
    console.log(e.markerId,"markertap")
  },
  controltap(e) {
    console.log(e.controlId, "controltap");
    this.load_location();
  },

  load_location:function()
  {
    const db = wx.cloud.database();
    var currentDate = util.formatDate(new Date());
    var that = this;
    const _ = db.command;
    var ps = [];
    var mks = [];

    var start = this.data.start_date + " " + this.data.start_time + ":" + "00";
    var stop = this.data.stop_date + " " + this.data.stop_time + ":" + "00";
    var start_time = Date.parse(start.replace(/-/g, '/'));
    var stop_time = Date.parse(stop.replace(/-/g, '/'));
    console.log('start_time: ' + start_time, 'stop_time: ' + stop_time);

    wx.showToast({
      title: '数据加载...',
      icon: 'loading',
      duration: 1000,
    });
    db.collection(db_name).where({
      _openid: this.data.openid,
      time: _.gte(start_time).lte(stop_time)
    })
    .count({
      success: function (res) {
        
        console.log(res)
        {
          var skip_num;
          // 向上取整
          skip_num = Math.ceil((res.total) / 20);
          if(skip_num == 0)
          {
            // 清除坐标
            that.setData({
              markers: mks,
              polyline: [{
                points: ps,
                color: "#ff6600",
                width: 5,
                dottedLine: false,
                arrowLine: true
              }]
            });
          }
          for (var skip = 0; skip < skip_num; skip++) {
              var timeout = 10 * skip;
              setTimeout(function (skip) {
                  console.log('collection: ' + skip * 20);
                  db.collection(db_name).where({
                    _openid: that.data.openid,
                    time: _.gte(start_time).lte(stop_time)
                  })
                  .limit(20)
                  .skip(20 * skip)
                  .get({
                    success: res => {
                      //this.setData({
                      //  queryResult: JSON.stringify(res.data, null, 2)
                      //});
                      var len = res.data.length;

                      wx.showToast({
                        title: '数据加载...',
                        icon: 'loading',
                        duration:1000,
                      });
                      console.log('[数据库] [查询记录] 成功: ', res);
                      for (var i = 0; i < len; i++) {
                        var index = "" + i;
                        var point = {
                          latitude: res.data[index].latitude,
                          longitude: res.data[index].longitude
                        };
                        ps.push(point);
                      }
                      {
                        var marker = {
                          iconPath: "/resources/map-marker.png",
                          title: res.data["0"].date + " " + res.data["0"].hour + ":" +
                            res.data["0"].minute + ":" + res.data["0"].second,
                          latitude: res.data["0"].latitude,
                          longitude: res.data["0"].longitude,
                          width: 30,
                          height: 30
                        };
                        mks.push(marker);

                        that.setData({
                          markers: mks,
                          polyline: [{
                            points: ps,
                            color: "#ff6600",
                            width: 5,
                            dottedLine: false,
                            arrowLine: true
                          }]
                        });
                      }
                    },
                    fail: err => {
                      wx.showToast({
                        icon: 'none',
                        title: '查询记录失败'
                      })
                      console.error('[数据库] [查询记录] 失败：', err);
                    }
                  });

              }, timeout, skip);
          } 
        }
      }
    });
  },

  /**
   * 定时器周期函数
   */
  timer_handle: function (res) {
    var that = this;
    var datetime;
    var ps = this.data.polyline["0"].points;

    console.log("上传位置信息");
    console.log("" + this.data.latitude, this.data.longitude);
    var point = {
      latitude: this.data.latitude,
      longitude: this.data.longitude
    };
    console.log("point", point);
    ps.push(point);
    that.setData({
      polyline: [{
        points: ps,
        color: "#ff6600",
        width: 5,
        dottedLine: false,
        arrowLine: true
      }],
    });

    datetime = new Date();
    var now_time = util.formatTime(datetime);
    var now_date = util.formatDate(datetime);
    var now_hour = util.formatHour(datetime);
    var now_minute = util.formatMinute(datetime);
    var now_second = util.formatSeconds(datetime);
    let time = datetime.getTime();
    //console.log(currentTime);
    const db = wx.cloud.database();
    db.collection(db_name).add({
      data: {
        latitude: point.latitude,
        longitude: point.longitude,
        date: now_date,
        hour: now_hour,
        minute: now_minute,
        second: now_second,
        time: time,
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        //wx.showToast({
        //  title: '新增记录成功',
        //})
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '新增记录失败'
        })
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  },

  onGetOpenid: function () {
    var that = this;
    
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        that.data.openid = res.result.openid
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    var param = 0;
    var datetime;
    var start_date;
    var stop_date;
    var stop_time;
    var that = this;

    datetime = new Date();

    start_date = util.formatDate(datetime);
    stop_date = util.formatDate(datetime);
    stop_time = util.formatTime(datetime);
    stop_time = stop_time.substring(0, 5);
    this.setData({
      start_date: start_date,
      stop_date: stop_date,
      stop_time: stop_time,
    });
    this.data.timer = setInterval(
      this.timer_handle,
      15000,
      param
     );
    this.onGetOpenid();
    wx.startLocationUpdateBackground();
    wx.startLocationUpdate();
    const _locationChangeFn = function (res) {
      console.log('location change', res);
      that.data.latitude = res.latitude;
      that.data.longitude = res.longitude;
    }
    wx.onLocationChange(_locationChangeFn);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    clearInterval(this.data.timer)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;

    console.log("onShow");
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
            }
          })
        }
      }
    });

    wx.getLocation({
      type: "gcj02",
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
      }
    });
  },

  bindDateStartChange:function(res)
  {
    this.setData({
      start_date: res.detail.value
    });
  },

  bindTimeStartChange:function(res)
  {
    this.setData({
      start_time: res.detail.value
    });
  },

  bindDateStopChange: function (res) {
    this.setData({
      stop_date: res.detail.value
    });
  },

  bindTimeStopChange: function (res) {
    this.setData({
      stop_time: res.detail.value
    });
  },

  /**
     * @creator 新猿意码
     * @data 2019/01/17
     * @desc 由经纬度计算两点之间的距离，la为latitude缩写，lo为longitude
     * @param la1 第一个坐标点的纬度
     * @param lo1 第一个坐标点的经度
     * @param la2 第二个坐标点的纬度
     * @param lo2 第二个坐标点的经度
     * @return (int)s   返回距离(单位千米或公里)
     * @tips 注意经度和纬度参数别传反了，一般经度为0~180、纬度为0~90
     * 具体算法不做解释，有兴趣可以了解一下球面两点之间最短距离的计算方式
     */
  distance: function (la1, lo1, la2, lo2) {
    var La1 = la1 * Math.PI / 180.0;
    var La2 = la2 * Math.PI / 180.0;
    var La3 = La1 - La2;
    var Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(La3 / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
    s = s * 6378.137;
    s = Math.round(s * 10000) / 10000;
    s = s.toFixed(2);
    return s;
  },

  mileagetap:function(res)
  {
    var ps = this.data.polyline["0"].points;
    var mileages;
    var speed;
    var that = this;

    speed = 0;
    wx.getLocation({
      type: "gcj02",
      success: function (res) {
        speed = res.speed;
        if (speed == -1) 
        {
          speed = 0;
        }
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        });
      }
    });
    
    mileages = 0;
    if (ps.length > 1)
    {
      for (var i = 0; i < ps.length - 1; i++) {
        let dist = this.distance(ps[i].latitude, ps[i].longitude, ps[i+1].latitude, ps[i+1].longitude);
        mileages += parseFloat(dist);
      }
    }
    //保留4位小数
    mileages = String(mileages).replace(/^(.*\..{4}).*$/, "$1");
    mileages = Number(mileages);
    speed = String(speed).replace(/^(.*\..{4}).*$/, "$1");
    speed = Number(speed);

    console.log(mileages);
    wx.showModal({
      title: '提示',
      content: "里程:" + mileages + ' km\r\n时速:' + speed + " m/s",
      showCancel: false,
      success(res) {
        if (res.confirm) {
          console.log('用户点击确定')
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  settingtap:function(){
    wx.openSetting({
      success: function (res) {
        if (!res.authSetting["scope.userInfo"] || !res.authSetting["scope.userLocation"]) {
          //这里是授权成功之后 填写你重新获取数据的js
          that.getLogiCallback('', function () {
            callback('')
          })
        }
      }
    })
  },

  deletetap:function()
  {
    const db = wx.cloud.database();
    const _ = db.command;
    var start = this.data.start_date + " " + this.data.start_time + ":" + "00";
    var stop = this.data.stop_date + " " + this.data.stop_time + ":" + "00";
    var start_time = Date.parse(start.replace(/-/g, '/'));
    var stop_time = Date.parse(stop.replace(/-/g, '/'));

    console.log('start_time: ' + start_time, 'stop_time: ' + stop_time);

    // wx.showToast({
    //   title: '数据删除...',
    //   icon: 'loading',
    //   duration: 1000,
    // });
    // db.collection(db_name)
    // .where({
    //   _openid: this.data.openid,
    //   time: _.gte(start_time).lte(stop_time)
    // }).remove({
    //   success: function (res) {
    //     wx.showToast({
    //       title: '数据删除成功',
    //       icon: 'loading',
    //       duration: 1000,
    //     });
    //   }
    // })
    wx.cloud.callFunction({
      name: 'location_remove',
      data: {
        openid: this.data.openid,
        start_time: start_time,
        stop_time: stop_time,
      },
      success: res => {
        wx.showToast({
          title: '删除成功',
        })
        console.log("remove", res);
        //  result: JSON.stringify(res.result)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '删除失败',
        })
        console.error('[云函数] [sum] 调用失败：', err)
      }
    })
  },
})

