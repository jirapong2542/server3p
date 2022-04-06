const express = require('express');
const db = require('./utils/database');
const client = require('./connect/connectmqtt');
const client1 = require('./connect/connectmqttrealtime');

const cors = require('cors');
const jwt = require('jsonwebtoken');
const lineNotify = require('line-notify-nodejs')('vdJwKnquR7u9Gw0N3UlOYrgY85annonkAfU3NXo59XM');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const axios = require('axios');
const qs = require('qs');
const token = 'vdJwKnquR7u9Gw0N3UlOYrgY85annonkAfU3NXo59XM';
const lineNotifyUrl = 'https://notify-api.line.me/api/notify';


///---------------------------------------------------------------
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/login', async (req, res) => {

    const { username, password } = req.body
    try {
        const [result] = await db.execute(`
        SELECT
            usr_id,
            usr_username,
            usr_password,
            usr_fname,
            usr_lname
        FROM
            user
        WHERE
            usr_username = ? AND usr_password = ?`
            , [username, password], (err, result) => {
                if (error) return res.json({ error: error });
            });

        if (result.length === 0) {
            res.status(200).json({ message: 'unauth' });
        } else {
            console.log(result);
            jwt.sign({ usr_id: result[0].usr_id }, 'Teen', (_, token) => {
                res.status(200).json({ message: 'OK', token });
            });
        }

    } catch (err) {
        console.log(err);
    }
});
app.post('/loginadmin', async (req, res) => {

    const { username, password } = req.body
    try {
        const [result] = await db.execute(`
        SELECT
           *
        FROM
            admin
        WHERE
            username = ? AND password = ?`
            , [username, password], (err, result) => {
                if (error) return res.json({ error: error });
            });

        if (result.length === 0) {
            res.status(200).json({ message: 'unauth' });
        } else {
            console.log(result);
            jwt.sign({ usr_id: result[0].usr_id }, 'Teen', (_, token) => {
                res.status(200).json({ message: 'OK', token });
            });
        }

    } catch (err) {
        console.log(err);
    }
})

app.post('/register', (req, res) => {

    const { username, password, confirm, firstname, lastname } = req.body
    try {
        if (username && password && confirm && firstname && lastname == "") {
            console.log("สมัครผิด")
        } else {

            db.query(` INSERT INTO user (usr_id, usr_username, usr_password, prf_id, usr_fname, usr_lname, created_at, updated_at) VALUES (NULL,?, ?,NULL, ?, ?, ?,?)`,
                [username, password, firstname, lastname, [new Date()], [new Date()]],
                (err, query) => {
                    console.log("err:", err)
                    if (err) {
                        return res.status(400).send();
                    }

                }
            );
            res.status(200).json({ message: 'สมัครสำเร็จ' });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }



});

app.post('/macaddress', async (req, res) => {

    const { usr_id } = req.body
    try {
        if (usr_id != "") {

            const [resultmacaddress] = await db.execute(`
        SELECT * FROM
            machine
        WHERE
            usr_id = ? `
                , [usr_id]);
            res.status(200).json(resultmacaddress[0]);
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});

app.post('/macaddressdevices', async (req, res) => {

    const { usr_id } = req.body

    try {
        if (usr_id != "") {

            const [resultmacaddress] = await db.execute(`
        SELECT * FROM
            machine
        WHERE
            usr_id = ? `
                , [usr_id]);

            console.log(resultmacaddress)
            res.status(200).json([resultmacaddress]);
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});

app.post('/chart', async (req, res) => {

    const { usr_id } = req.body
    try {
        if (usr_id != "") {
            const [resultmacaddress] = await db.execute(`
        SELECT * FROM
            machine
        WHERE
            usr_id = ? `
                , [usr_id]);
            res.status(200).json(resultmacaddress);
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});

app.post('/chartdata', async (req, res) => {

    const { macaddress } = req.body

    try {
        if (macaddress != "") {

            const [resultdata] = await db.execute(`
        SELECT * FROM
            data_machine
        WHERE
            m_mac_address  = ? `
                , [macaddress]);


            console.log(resultdata)
            res.status(200).json(resultdata);

        }
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});

app.post('/edit', async (req, res) => {

    const { Modalm_id, Modalusr_id, ModalName, ModalMacaddress } = req.body

    try {
        const [result] = await db.execute(`
        UPDATE machine
        SET m_mac_address = ? , m_name = ?
        WHERE
          m_id = ? and usr_id = ? `
            , [ModalMacaddress, ModalName, Modalm_id, Modalusr_id],
            (error, results) => {
                if (error) return res.json({ error: error });
            }
        );
        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }

});


app.post('/delete', async (req, res) => {

    const { m_id, usr_id, Name, Macaddress } = req.body

    try {
        const [result] = await db.execute(`
         DELETE FROM machine
         WHERE m_id = ? and usr_id = ? and m_mac_address = ? and m_name = ?`
            , [m_id, usr_id, Macaddress, Name],
            (error, results) => {
                if (error) return res.json({ error: error });
            }
        );
        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }

});

app.post('/addMacAddress', async (req, res) => {

    const { usr_id, addMacAddress } = req.body
    console.log(usr_id, addMacAddress)
    try {
        db.query(` INSERT INTO machine ( usr_id, m_mac_address ,m_name) VALUES (?, ?,?)`,
            [usr_id, addMacAddress, 'PZEM'],
            (error, result) => {
                if (error) {
                    console.log(error)
                    return
                } else {
                    res.status(error).json({ message: 'Not Found' });
                }
            }
        );
        res.status(200).json({ message: 'สมัครสำเร็จ' });
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }


});

app.post('/adminuser', async (req, res) => {

    try {
        const [resultmacaddress] = await db.execute(`
        SELECT * FROM user`
        );
        res.status(200).json(resultmacaddress);
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});

app.post('/adminedituser', async (req, res) => {

    const { Modalusr_id, Modalfname, Modallname, ModalUsername, Modalpassword } = req.body
    try {
        const [result] = await db.execute(`
        UPDATE user
        SET usr_username = ? , usr_password = ?,usr_fname = ?,usr_lname = ?
        WHERE
          usr_id = ? `
            , [ModalUsername, Modalpassword, Modalfname, Modallname, Modalusr_id],
            (err, results) => {
                if (err) return res.json({ error: error });
            }
        );
        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }

});
app.post('/admindeleteuser', async (req, res) => {

    const { usr_id, usr_username, usr_password } = req.body

    try {
        const [result] = await db.execute(`
         DELETE FROM user
         WHERE usr_id = ? and usr_username = ? and usr_password = ?`
            , [usr_id, usr_username, usr_password],
            (err, results) => {
                if (err) return res.json({ error: error });
            }
        );
        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }

});

app.post('/adminmachine', async (req, res) => {

    try {
        const [resultmacaddress] = await db.execute(`
        SELECT * FROM machine INNER JOIN user on machine.usr_id = user.usr_id;`
        );
        res.status(200).json(resultmacaddress);
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});

app.post('/admineditmachine', async (req, res) => {

    const { modalm_id, Modalusr_id, ModalMacaddress, Modalname } = req.body

    try {
        const [result] = await db.execute(`
        UPDATE machine
        SET m_mac_address = ? , m_name = ?
        WHERE
          usr_id = ? and m_id=?`
            , [ModalMacaddress, Modalname, Modalusr_id, modalm_id],
            (error, results) => {
                if (error) return res.json({ error: error });
            }
        );
        res.status(200).json(result);

    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }

});
app.post('/admindeletemachine', async (req, res) => {

    const { m_id } = req.body

    try {
        const [result] = await db.execute(`
         DELETE FROM machine
         WHERE m_id = ?`
            , [m_id],
            (error, results) => {
                if (error) return res.json({ error: error });
            }
        );
        res.status(200).json(result);

    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }


});
//``````````````````````````````````````````````````````````````````````````````````````````````

//----------------------รับค่า MQTT // และ บันทึกเข้า database---------------------

client.on('message', (topic, message) => {

    let obj = JSON.parse(message.toString());
    // Voltage

    //console.log(obj.data[0]);
    let m_mac_address = obj.MAC
    console.log(m_mac_address);
    let Voltagep1 = obj.data[0].output[0]
    console.log("Voltagep1:" + Voltagep1)
    let Voltagep2 = obj.data[0].output[1]
    console.log("Voltagep1:" + Voltagep2)
    let Voltagep3 = obj.data[0].output[2]
    console.log("Voltagep1:" + Voltagep3)

    // Current
    console.log(obj.data[1]);
    let Currentp1 = obj.data[1].output[0]
    console.log("Voltagep1:" + Currentp1)
    let Currentp2 = obj.data[1].output[1]
    console.log("Voltagep1:" + Currentp2)
    let Currentp3 = obj.data[1].output[2]
    console.log("Voltagep1:" + Currentp3)

    // Power
    console.log(obj.data[2]);
    let Powerp1 = obj.data[2].output[0]
    console.log("Powerp1:" + Powerp1)
    let Powerp2 = obj.data[2].output[1]
    console.log("Powerp2:" + Powerp2)
    let Powerp3 = obj.data[2].output[2]
    console.log("Powerp3:" + Powerp3)

    // Energy
    console.log(obj.data[3]);
    let Energyp1 = obj.data[3].output[0]
    console.log("Energyp1:" + Energyp1)
    let Energyp2 = obj.data[3].output[1]
    console.log("Energyp2:" + Energyp2)
    let Energyp3 = obj.data[3].output[2]
    console.log("Energyp3:" + Energyp3)

    // Frequency
    console.log(obj.data[4]);
    let Frequencyp1 = obj.data[4].output[0]
    console.log("Frequencyp1:" + Frequencyp1)
    let Frequencyp2 = obj.data[4].output[1]
    console.log("Frequencyp2:" + Frequencyp2)
    let Frequencyp3 = obj.data[4].output[2]
    console.log("Frequencyp3:" + Frequencyp3)


    // Factor
    console.log(obj.data[5]);
    let Factorp1 = obj.data[5].output[0]
    console.log("Factorp1:" + Factorp1)
    let Factorp2 = obj.data[5].output[1]
    console.log("Factorp2:" + Factorp2)
    let Factorp3 = obj.data[5].output[2]
    console.log("Factorp3:" + Factorp3)



    // let m_mac_address = obj.MAC;
    // let md_volt = obj.data[0].output.toString().replace(",", " ").replace(",", " ");
    // let md_current = obj.data[1].output.toString().replace(",", " ").replace(",", " ");
    // let md_power = obj.data[2].output.toString().replace(",", " ").replace(",", " ");
    // let md_energy = obj.data[3].output.toString().replace(",", " ").replace(",", " ");
    // let md_frequency = obj.data[4].output.toString().replace(",", " ").replace(",", " ");
    // let md_factor = obj.data[5].output.toString().replace(",", " ").replace(",", " ");

    // console.log(m_mac_address);
    // console.log(md_volt);
    // console.log(md_current);
    // console.log(md_power);
    // console.log(md_energy);
    // console.log(md_frequency);
    // console.log(md_factor);
    // console.log("---------------------------");
    // lineNotify.notify({
    //     message: '[บันทึกข้อมูลสำเร็จ]',
    // }).then(() => {
    //     console.log('send completed!');
    // });

    db.query(`INSERT INTO data_machine
     (md_id, m_mac_address, md_volt_p1, md_volt_p2, md_volt_p3, md_current_p1, md_current_p2, md_current_p3, md_power_p1, md_power_p2, md_power_p3, md_energy_p1, md_energy_p2, md_energy_p3, md_frequency_p1, md_frequency_p2, md_frequency_p3, md_factor_p1, md_factor_p2, md_factor_p3)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [null, m_mac_address, Voltagep1, Voltagep2, Voltagep3, Currentp1, Currentp2, Currentp3, Powerp1, Powerp2, Powerp3, Energyp1, Energyp2, Energyp3, Frequencyp1, Frequencyp2, Frequencyp3, Factorp1, Factorp2, Factorp3],
        (error, results) => {
            if (error) return res.json({ error: error });
        }
    );
});

var notifyVoltagepsum = false;
var notifyVoltagepsum1 = false;
var notifysumVoltage = false;
var notifysumCurrent = false;

var notifyVoltagep1 = false;
var notifyVoltagep2 = false;
var notifyVoltagep3 = false;

client1.on('message', (topic, message) => {

    let obj = JSON.parse(message.toString());
    // Voltage
    //console.log(obj.data[1]);
    var Voltagep1 = obj.data[0].output[0];
    var Voltagep2 = obj.data[0].output[1];
    var Voltagep3 = obj.data[0].output[2];
    var sumVoltage = (obj.data[0].output[0] + obj.data[0].output[1] + obj.data[0].output[2]) / 3
    var SumCurrent = (obj.data[1].output[0] + obj.data[1].output[1] + obj.data[1].output[2]) / 3
    //console.log(sumVoltage);

    // console.log(Voltagep3);

    if (sumVoltage >= 250) {
        console.log(">= 245");
        if (notifysumVoltage === false) {
            lineNotify.notify({
                message: '\n' +
                    'ไฟฟ้าทำงานผิดปกติ \n' +
                    'phase 1 : ' + Voltagep1 + '\n' +
                    'phase 2 : ' + Voltagep2 + '\n' +
                    'phase 3 : ' + Voltagep3
            }).then(() => {
                console.log('send completed!');
            });
            notifysumVoltage = true;
        }

    } else if (sumVoltage <= 2) {

        lineNotify.notify({
            message: '\n' +
                'ไฟฟ้าดับ \n' +
                'phase 1 : ' + Voltagep1 + '\n' +
                'phase 2 : ' + Voltagep2 + '\n' +
                'phase 3 : ' + Voltagep3
        }).then(() => {
            console.log('send completed!');
        });
        notifysumVoltage = true;
    } else if (sumVoltage <= 200) {
        console.log("<=200");
        lineNotify.notify({
            message: '\n' +
                'ไฟฟ้าทำงานผิดปกติ \n' +
                'phase 1 : ' + Voltagep1 + '\n' +
                'phase 2 : ' + Voltagep2 + '\n' +
                'phase 3 : ' + Voltagep3
        }).then(() => {
            console.log('send completed!');
        });

    } else {
        notifysumVoltage = false;
    }

    if (SumCurrent >= 85) {
        console.log(">= 85");
        if (notifysumCurrent === false) {
            lineNotify.notify({
                message: '\n' +
                    'กระแสไฟฟ้าทำงานผิดปกติ'
            }).then(() => {
                console.log('send completed!');
            });
            notifysumCurrent = true;
        }

    } else {
        notifysumCurrent = false;
    }


    // if (Voltagep1 && Voltagep2 && Voltagep3 <= 180 && Voltagep1 && Voltagep2 && Voltagep3 >= 50) {
    //     console.log("แรงดันไฟฟ้า")

    //     if (notifyVoltagepsum === false) {
    //         lineNotify.notify({
    //             message: '\n' +
    //                 'ไฟฟ้าทำงานผิดปกติ \n' +
    //                 'phase 1 : ' + Voltagep1 + '\n' +
    //                 'phase 2 : ' + Voltagep2 + '\n' +
    //                 'phase 3 : ' + Voltagep3
    //         }).then(() => {
    //             console.log('send completed!');
    //         });
    //     }
    //     notifyVoltagepsum = true;

    // } else {
    //     notifyVoltagepsum = false;
    // }

    // if (Voltagep1 && Voltagep2 && Voltagep3 <= 50 && Voltagep1 && Voltagep2 && Voltagep3 >= 0) {
    //     console.log("แรงดันไฟฟ้า")

    //     if (notifyVoltagepsum1 === false) {
    //         lineNotify.notify({
    //             message: '\n' +
    //                 'ไฟฟ้าทำงานผิดปกติ \n' +
    //                 'phase 1 : ' + Voltagep1 + '\n' +
    //                 'phase 2 : ' + Voltagep2 + '\n' +
    //                 'phase 3 : ' + Voltagep3
    //         }).then(() => {
    //             console.log('send completed!');
    //         });
    //     }
    //     notifyVoltagepsum1 = true;

    // } else {
    //     notifyVoltagepsum1 = false;
    // }


});


app.listen(5000, () => {
    console.log(`Listening at http://localhost:5000`);
});