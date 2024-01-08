export const imputarea = () => {
    // Firebaseのリファレンスをグローバル変数として宣言
        let dbRef;

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        // 上のgetDatabaseを取る。データベースの参照を作成
        // データベースの参照を作成。getDatabaseとrefを引っ張ってきている
        const db = getDatabase(app);
        // databaseの中に"sendpin"に送る。sendpinはfirebase側で設定(マニュアル上「chat」)
        dbRef = ref(db, "sendpin");

        let msgForMap = null;

        // pintypeを画像にする

        // (1)登録ボタンで内容をfirebaseに送る
        $("#send").on("click", function () {
            // 送信データ
            let msg;
            msg = {
                // ピンカラーも指定したい
                // 画像を飛ばすよう変更予定
                pincolor: $("#pincolor").val(),
                pintype: $("#pintype").val(),
                // 緯度経度は入力画面に出たものではなくイベントハンドラーから直接取る
                geocode: addressForFirebase,
                lat: latForFirebase,
                lon: lonForFirebase,
                //ピン名
                title: $("#title").val(),
                //メモ
                description: $("#description").val(),
            };
            console.log(dbRef);
            // newPostRef：chatのとこに識別するランダムな文字列(ランダムキー。ID番号てきなもの)を生成するもの。
            const newPostRef = push(dbRef);
            const key = newPostRef.key; // 生成されたキーを取得。infobox更新時に照合するため使用。addInfoToOptionsで情報渡す

            set(newPostRef, msg);
            // 入力フォームを空にする
            $("#title, #description").val("");

            // 新しい情報を options に追加
            addInfoToOptions(key, msg);

            console.log(addInfoToOptions);
        });

        // (2)
        // mapで使いたいのでkeyとは別に採番する

        onChildAdded(dbRef, function (data) {
            const msg = data.val();
            // keyはappend,prepandでは使わないが削除、更新に必要
            const key = data.key;//ユニークキーの取得

            // テンプレートリテラルで作ってみる！バッククオート(`)の置く場所が注意
            let h = `<div id="${key}" >`;//+key+でkeyの中身を指定。テンプレートリテラル使ってみた！
            // 以下trなどに直接class,idを指定してもうまく情報が渡らなかったのですべてにdivをつけている
            h += `<table><tr><div class='saibankey' id="${key}_udKey">${key}</div></tr>`;
            h += `<tr><td><div class='pincolor' id="${key}_udPinColor">${msg.pincolor}</div></td>`;
            h += `<td><div class='pintype' id="${key}_udPinType">${msg.pintype}</div></td></tr>`;
            h += `<tr><div colspan='2' class='pintitle' id="${key}_udTitle">${msg.title}</div></tr>`;
            h += `<tr><div colspan='2' class='address' id="${key}_udAddress">住所："${msg.geocode}"</div></tr>`;
            // 以下追加。直接その場で更新できるコード。id='"+key+"_update'は'と'で文字にしてて、「keyの名前+_update」てid名になる
            // h += "<tr><th colspan='2' class='pindescription' style='white-space: pre-line; text-align: left;'>"
            h += `<tr><span colspan='2' class='pindescription' id="${key}_udDescription">${msg.description}</span></tr>`
            h += `<tr><span class='lat' id="${key}_udLat" hidden>${msg.lat}</span></tr><tr><span class='lon' id="${key}_udLon" hidden>${msg.lon}</span></tr>`
            //data-〇〇属性は唯一自分で作れる！aでもbでも。他はidとかhrefとか指定の属性
            // data-key は各データのユニークなキー (data.key) を HTML 要素の属性として持つための任意の名前を使った属性値
            h += "<div class='btn'>"
            h += `<span style='margin: 0 5px;' class='remove' data-key="${key}"><button>suteru</button></span>`
            h += `<span style='margin: 0 5px;' class='update' data-key="${key}"><button>kaeru</button></span>`
            h += "</div>"
            h += "<div class='space10'></div>";
            h += "<div class='border'></div>"
            h += "</div>";
            $("#output").prepend(h); // #output の最後に追加
            // firebaseを使えないから採番。なぜか２から始まる！質問する
            console.log(output);
        });

        // 削除イベント
        // output部分に作用する。removeはfunctionの第二引数。outputの中のremoveを監視
        $("#output").on("click", ".remove", function () {
            // thisは、色々removeボタンある中で、ここにだけ作用する、の意。attrはattribute(属性)。removeをクリックしたとこのkeyだけを取る
            const key = $(this).attr("data-key");
            console.log("Removing data with key:", key);
            const remove_item = ref(db, "sendpin/" + key);
            //removeは関数。
            remove(remove_item); //Firebaseデータが削除される。まだこの段階では表示はされない。onChildRemovedで表示も変わる。
        });

        // 削除処理＞Firebase側実行＞の後webに反映イベント
        onChildRemoved(dbRef, (data) => {
            console.log(data.key, "keydesu");
            $("#" + data.key).remove(); //dom操作関数。()忘れずに      
            console.log("Child removed with key:", data.key);
        });
        // 更新イベント
        // 更新用boxに反映
        $("#output").on("click", ".update", function () {
            const key = $(this).attr("data-key");

            // データを一度オブジェクトに入れてからのほうがミスがない
            // .classの前にスペースがないとIDがkeyでかつクラスがpincolor(例)の要素を選択
            // .classの前にスペースがあると、IDの子要素のクラスがpinclor(例)の意味になる！
            const pinData = {
                key: $("#" + key + " .saibankey").text(),
                pincolor: $("#" + key + " .pincolor").text(),
                pintype: $("#" + key + " .pintype").text(),
                title: $("#" + key + " .pintitle").text(),
                description: $("#" + key + " .pindescription").text(),
                lat: $("#" + key + " .lat").text(),
                lon: $("#" + key + " .lon").text(),
            };
            console.log(pinData);

            $(document).ready(function () {
                $("#repincolor").val(pinData.pincolor);
                $("#repintype").val(pinData.pintype);
                $("#retitle").val(pinData.title);
                $("#redescription").val(pinData.description);
                $("#rekey").html(pinData.key);  
                $("#relat").html(pinData.lat);
                $("#relon").html(pinData.lon);
            });

        });

        // 更新用boxを再登録するとfirebaseが書き換わる指示
        $("#kousinbox").off("click", "#resend", "#resend");
        $("#kousinbox").on("click", "#resend", function () {

            // thisは、色々removeボタンある中で、ここにだけ作用する、の意。attrはattribute(属性)。removeをクリックしたとこのkeyだけを取る

            const updatedData = {
                key: $("#rekey").html(),
                pincolor: $("#repincolor").val(),
                pintype: $("#repintype").val(),
                geocode: $("#regeocode").html(),
                lat: latForFirebase !== null ? latForFirebase : $("#relat").html(),
                lon: lonForFirebase !== null ? lonForFirebase : $("#relon").html(),
                title: $("#retitle").val(),
                description: $("#redescription").val(),
            };
            const key = updatedData.key;
            update(ref(db, "sendpin/" + key), updatedData);

            // mapのscriptに情報を渡す
            udInfoBox(updatedData);
            console.log(updatedData)

        });

        // 更新処理がFirebase側で実行されたらイベントが発生する。
        //onChildChangedは監視してたとこになにか変更があったら何するか指示できる
        onChildChanged(dbRef, (data) => {
            console.log("Child changed:", data.val());
            $("#" + data.key + "_udPinColor").html(data.val().pincolor);
            $("#" + data.key + "_udPinType").html(data.val().pintype);
            $("#" + data.key + "_udTitle").html(data.val().title);
            $("#" + data.key + "_udDescription").html(data.val().description);
            $("#" + data.key + "_udAddress").html(data.val().geocode);
        });

}