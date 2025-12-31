var firebaseConfig = { 
  apiKey : "AIzaSyDWMMJab7t_EzMns27VSlkB0noyT4irZvQ" , 
  authDomain : "exclusive-player-1c8c4.firebaseapp.com" , 
  projectId : "exclusive-player-1c8c4" , 
  storageBucket : "exclusive-player-1c8c4.firebasestorage.app" , 
  messagingSenderId : "73815415264" , 
  appId : "1:73815415264:web:d72fb6d1070c0532ca7385" 
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
  db.collection("TMBDID").get()
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
