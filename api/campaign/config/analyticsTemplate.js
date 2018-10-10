var moment = require('moment');

const analyticsTemplate = (invoice, user) => {
  const renderRows = () => {
    users.map((user, index) => {
      return `
        <td>
          ${index}
        </td>
        <td>
          ${user.name}
        </td>
        <td>
          ${user.email}
        </td>
        <td>
          ${user.location}
        </td>
        <td>
          ${user.country}
        </td>
        <td>
          ${user.signup}
        </td>
      `;
    });
  };
  var html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>invoice template</title>
        <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet">
        <style>
          .invoice-box {
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
              max-width: 800px;
              margin: auto;
              padding: 30px;
              border: 1px solid #eee;
              box-shadow: 0 0 10px rgba(0, 0, 0, .15);
              font-size: 12px;
              line-height: 24px;
              font-family: 'Source Sans Pro', sans-serif;
              color: #555;
          }

          .invoice-box table {
              width: 100%;
              line-height: inherit;
              text-align: left;
          }

          .invoice-box table tr .invoice-details {
            font-size: 10px;
          }

          .invoice-box table td {
              padding: 5px;
              vertical-align: top;
          }

          .invoice-box table tr.top table td {
              padding-bottom: 20px;
          }

          .invoice-box table tr.top table td.title {
              font-size: 45px;
              line-height: 45px;
              color: #333;
          }

          .invoice-box table tr.top table td.analytics {
              text-align: right;
          }
          .invoice-box table tr.information table td {
              padding-bottom: 40px;
          }

          .invoice-box table tr.heading td {
              background: #eee;
              border-bottom: 1px solid #ddd;
              font-weight: bold;
          }

          .invoice-box table tr.details td {
              padding-bottom: 20px;
          }

          .invoice-box table tr.item td{
              border-bottom: 1px solid #eee;
          }

          .invoice-box table tr.item.last td {
              border-bottom: none;
          }

          .invoice-box table tr.total td:nth-child(2) {
              border-top: 2px solid #eee;
              font-weight: bold;
          }

          @media only screen and (max-width: 600px) {
              .invoice-box table tr.top table td {
                  width: 100%;
                  display: block;
                  text-align: center;
              }

              .invoice-box table tr.information table td {
                  width: 100%;
                  display: block;
                  text-align: center;
              }
          }


        </style>
      </head>

      <body>
        <div class="invoice-box">
          <table cellpadding="0" cellspacing="0">
            <tr class="top">
              <td colspan="12">
                <table>
                  <tr>
                    <td class="title">
                      <img src="https://useinfluence.co/static/media/newlogo-6.d7af3d5a.png" style="width:100%; max-width:250px;">
                    </td>

                    <td class="title analytics">
                     Analytics
                    </td>
                  </tr>
                </table>
              </td>
            </tr>


            <tr class="heading">
              <td>
                #
              </td>
              <td>
                Name
              </td>
              <td>
                Email
              </td>
              <td>
                Location
              </td>
              <td>
                Country
              </td>
              <td>
                Signup on
              </td>
            </tr>

            <tr class="details">
              ${renderRows()}
            </tr>

          </table>
        </div>
      </body>
    </html>
  `;
  return html;
}

module.exports = analyticsTemplate;
