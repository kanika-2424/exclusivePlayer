var firebaseConfig = {
  apiKey: "AIzaSyB1rqGO8JIjuXrF5fxzsCY4siuHHYoZJRc",
  authDomain: "exclusive-players.firebaseapp.com",
  projectId: "exclusive-players",
  storageBucket: "exclusive-players.firebasestorage.app",
  messagingSenderId: "528869981938",
  appId: "1:528869981938:web:ebdafb9d3e513e52519a6b"
};


firebase.initializeApp(firebaseConfig);
firebase.analytics();

var db = firebase.firestore();

window.logAllDnsEntries = function () {
  db.collection("DNS").get()
    .then(function (snapshot) {
      snapshot.forEach(function (doc) {
        console.log("DNS Entry:", doc.id, "=>", doc.data());
        localStorage.setItem("all_dns", JSON.stringify(doc.data().DNS));
      });

    })
    .catch(function (error) {
      alert("Error getting DNS entries: " + error.message);
    });
};

window.getTmbdId = function () {
  db.collection("TMDBID").get()
    .then(function (snapshot) {
      snapshot.forEach(function (doc) {
        const tmbdId=doc.data().tmbd_api_key? doc.data().tmbd_api_key : ""
        console.log("TMDBID Entry:", doc.id, "=>", tmbdId);
        localStorage.setItem("tmbdId", tmbdId);
      });

    })
    .catch(function (error) {
      alert("Error getting TMDBID entries: " + error.message);
    });
};
