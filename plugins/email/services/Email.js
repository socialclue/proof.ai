'use strict';



/**
 * Email.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const _ = require('lodash');
const env = require('dotenv').config()
const sgMail = require('@sendgrid/mail');
const template = require('../libs/template');

/**
 * Final Service Call From Here.
 * @param mailOptions
 * @returns {Promise<*>}
 */

 async function sendMail(mailOptions) {
   let v;
   try {
     sgMail.setApiKey(process.env.SENDGRID_API_KEY);
     v = await sgMail.send(mailOptions);
   } catch (e) {
     return e;
   }
   return v;
}

/**
 * We should use this inside from the service.
 * @param options
 * @returns {Promise<*>}
 */

async function send(options) {
  options.from = options.from || '"Support Useinfluence" <support@useinfluence.co>';
  options.replyTo = options.replyTo || '"Support Useinfluence" <support@useinfluence.co>';
  options.text = options.text || options.html;
  options.html = options.html || options.text;

  let send;

  // Send the email.
  send = await sendMail(options);

  return send;

}

module.exports = {

  /**
   * We should use this outside from this as a service.
   * @param options
   * @returns {Promise<send>}
   */
  send: async (options) => {
      // Default values
    await send(options);
    return send;
  },

  /**
   * Final Account Created Template.
   * @param email
   * @param name
   * @returns {Promise<*>}
   */
  accountCreated: async (email, name, verificationToken) =>  {
      const mailSub = "Account has been created";
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>This is a confirmation email to let you know that your account has been created.</div>
            </td>
          </tr>
        </table>
        <table border="0" cellPadding="0" cellSpacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed" width="100%">
          <tbody>
            <tr>
              <td align="center" class="outer-td" style="padding:0px 0px 0px 0px">
                <table border="0" cellPadding="0" cellSpacing="0" class="button-css__deep-table___2OZyb wrapper-mobile" style="text-align:left">
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="#097fff" class="inner-td" style="border-radius:6px;font-size:16px;text-align:center;background-color:inherit"><a style="background-color:#097fff;border:1px solid #333333;border-color:#097fff;border-radius:5px;border-width:1px;color:#ffffff;display:inline-block;font-family:arial,helvetica,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0px;line-height:16px;padding:12px 18px 12px 18px;text-align:center;text-decoration:none" href="https://useinfluence.co/verify/${verificationToken}" target="_blank">Verify</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>Thanks for investing your faith in us.</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'noreply@useinfluence.co',
        to: email,
        subject: mailSub || 'Your Account has been created',
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Password Reset Email.
   * @param email
   * @param name
   * @param resetPasswordToken
   * @returns {Promise<*>}
   */
  resetPassword: async (email, name, resetPasswordToken) =>  {
      const mailSub = "Reset Password"
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>You told us you forgot your password. If you really did, click here to choose a new one</div>
            </td>
          </tr>
        </table>
        <table border="0" cellPadding="0" cellSpacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed" width="100%">
          <tbody>
            <tr>
              <td align="center" class="outer-td" style="padding:0px 0px 0px 0px">
                <table border="0" cellPadding="0" cellSpacing="0" class="button-css__deep-table___2OZyb wrapper-mobile" style="text-align:left">
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="#097fff" class="inner-td" style="border-radius:6px;font-size:16px;text-align:center;background-color:inherit"><a style="background-color:#097fff;border:1px solid #333333;border-color:#097fff;border-radius:5px;border-width:1px;color:#ffffff;display:inline-block;font-family:arial,helvetica,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0px;line-height:16px;padding:12px 18px 12px 18px;text-align:center;text-decoration:none" href="https://useinfluence.co/reset-password?code=${resetPasswordToken}" target="_blank">Choose a New Password</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>If you didn&#39;t mean to reset your password, then you can just ignore this email, and your password will remain same.</div>
              <div>&nbsp;</div>
              <div>Thanks!</div>

            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'support@useinfluence.co',
        to: email,
        subject: mailSub || 'Your Account has been created',
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Plan limit exceeded Template.
   * @param email
   * @param name
   * @param limit
   * @returns {Promise<*>}
   */
  limitExceeded: async (email, name, limit) =>  {
      const mailSub = `Account Limit ${limit} exceeded`;
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>This is a confirmation email to let you know that your account has exceeded the limit.</div>
            </td>
          </tr>
        </table>
        <table border="0" cellPadding="0" cellSpacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed" width="100%">
          <tbody>
            <tr>
              <td align="center" class="outer-td" style="padding:0px 0px 0px 0px">
                <table border="0" cellPadding="0" cellSpacing="0" class="button-css__deep-table___2OZyb wrapper-mobile" style="text-align:left">
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="#097fff" class="inner-td" style="border-radius:6px;font-size:16px;text-align:center;background-color:inherit"><a style="background-color:#097fff;border:1px solid #333333;border-color:#097fff;border-radius:5px;border-width:1px;color:#ffffff;display:inline-block;font-family:arial,helvetica,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0px;line-height:16px;padding:12px 18px 12px 18px;text-align:center;text-decoration:none" href="https://useinfluence.co/login" target="_blank">Upgrade</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>Thanks for investing your faith in us.</div>
              <div>See you soon.</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'noreply@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Demo Page Template.
   * @param query
   * @returns {Promise<*>}
   */
  demoRequested: async (query) =>  {
    const email = query.email;
    const firstname = query.firstname;
    const lastname = query.lastname;
    const phonenumber = query.phonenumber;
    const company = query.company;
    const totalEmployee = query.totalEmployee;
    const department = query.department;
    const mailSub = "Demo requested";
    const content =`
      <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;" height="100%" valign="top" bgcolor="">
            <div>Hey ${firstname},</div>
            <div>&nbsp;</div>
            <div>First Name: ${firstname}</div>
            <div>&nbsp;</div>
            <div>Last Name: ${lastname}</div>
            <div>&nbsp;</div>
            <div>Email: ${email}</div>
            <div>&nbsp;</div>
            <div>Phone Number: ${phonenumber}</div>
            <div>&nbsp;</div>
            <div>Company: ${company}</div>
            <div>&nbsp;</div>
            <div>Total Employees: ${totalEmployee}</div>
            <div>&nbsp;</div>
            <div>Department: ${department}</div>
            <div>&nbsp;</div>
          </td>
        </tr>
      </table>
      <table border="0" cellPadding="0" cellSpacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed" width="100%">
        <tbody>
          <tr>
            <td align="center" class="outer-td" style="padding:0px 0px 0px 0px">
              <table border="0" cellPadding="0" cellSpacing="0" class="button-css__deep-table___2OZyb wrapper-mobile" style="text-align:left">
                <tbody>
                  <tr>
                    <td align="center" bgcolor="#097fff" class="inner-td" style="border-radius:6px;font-size:16px;text-align:center;background-color:inherit"><a style="background-color:#097fff;border:1px solid #333333;border-color:#097fff;border-radius:5px;border-width:1px;color:#ffffff;display:inline-block;font-family:arial,helvetica,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0px;line-height:16px;padding:12px 18px 12px 18px;text-align:center;text-decoration:none" href="https://useinfluence.co/" target="_blank">Demo</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
              height="100%"
              valign="top"
              bgcolor="">
            <div>Thanks for investing your faith in us.</div>
            <div>See you soon.</div>
          </td>
        </tr>
      </table>
    `;

    var mytemp = template.commontemp(mailSub, firstname, content);

    let mailOptions = {
      from: 'info@useinfluence.co',
      to: 'support@useinfluence.co',
      subject: mailSub,
      html: mytemp
    };
    return send(mailOptions);
  },

  /**
   * Affiliate Page Template.
   * @param query
   * @returns {Promise<*>}
   */
  affiliateRegister: async (query) =>  {
    const email = query.email;
    const name = query.name;
    const mailSub = "Affiliate Registeration";
    const content =`
      <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;" height="100%" valign="top" bgcolor="">
            <div>${name} register for Affiliate,</div>
            <div>&nbsp;</div>
            <div>Name: ${name}</div>
            <div>&nbsp;</div>
            <div>Email: ${email}</div>
            <div>&nbsp;</div>
          </td>
        </tr>
      </table>
      <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
              height="100%"
              valign="top"
              bgcolor="">
            <div>Thanks for investing your faith in us.</div>
            <div>See you soon.</div>
          </td>
        </tr>
      </table>
    `;

    var mytemp = template.commontemp(mailSub, name, content);

    let mailOptions = {
      from: 'info@useinfluence.co',
      to: 'support@useinfluence.co',
      subject: mailSub,
      html: mytemp
    };
    return send(mailOptions);
  },

  /**
   * Contact Us Page Template.
   * @param query
   * @returns {Promise<*>}
   */
  contactUs: async (query) =>  {
    const email = query.email;
    const name = query.name;
    const message = query.message;
    const mailSub = "Contact Us";
    const content =`
      <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;" height="100%" valign="top" bgcolor="">
            <div>${name} wants to connect.</div>
            <div>&nbsp;</div>
            <div>Name: ${name}</div>
            <div>&nbsp;</div>
            <div>Email: ${email}</div>
            <div>&nbsp;</div>
            <div>Message: ${message}</div>
            <div>&nbsp;</div>
          </td>
        </tr>
      </table>
      <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
              height="100%"
              valign="top"
              bgcolor="">
            <div>Thanks for investing your faith in us.</div>
            <div>See you soon.</div>
          </td>
        </tr>
      </table>
    `;

    var mytemp = template.commontemp(mailSub, name, content);

    let mailOptions = {
      from: 'info@useinfluence.co',
      to: 'support@useinfluence.co',
      subject: mailSub,
      html: mytemp
    };
    return send(mailOptions);
  },


  /**
   * gdprform Page Template.
   * @param query
   * @returns {Promise<*>}
   */
  gdprForm: async (query) =>  {
    const email = query.email;
    const code = query.code;
    const mailSub = "GDPR Form sunbmition";
    const content =`
      <br/>
      <span>This is a confirmation email to let you know that you have been successfully GRPR Compliance.</span>
      <br/>
      <span>Please Enter the code in GDPR Form : {code}</span>
      <br/>
      {code}
      <br/>
      <span>Thanks for investing your faith in us.</span>
      <br/>
      <span>See you soon.</span>
      <br/>
      <span>Thanks!</span>
    `;

    var mytemp = template.commontemp(mailSub, code, content);

    let mailOptions = {
      from: 'support@useinfluence.co',
      to: email,
      subject: mailSub,
      html: mytemp
    };
    return send(mailOptions);
  },

  campaignIssue: async(email, name, campaign) => {
    const mailSub = "Issue with user campaign.";
    const content =`
      <br/>
      <span>This is to let you know about the urgent issue regarding User's campaign.</span>
      <br/>
      <span>User : {name}</span>
      <br/>
      <span>Email : {email}</span>
      <br/>
      <span>Campaign Name : {campaign.campaignName}</span>
      <br/>
      <span>Campaign URL : {campaign.websiteUrl}</span>
      <br/>
      <span>Thanks for investing your faith in us.</span>
      <br/>
      <span>See you soon.</span>
      <br/>
      <span>Thanks!</span>
    `;

    var mytemp = template.commontemp(mailSub, name, content);

    let mailOptions = {
      from: 'info@useinfluence.co',
      to: 'support@useinfluence.co',
      subject: mailSub,
      html: mytemp
    };
    return send(mailOptions);
  },


  /**
   * Account Pause and delete mail.
   * @param email
   * @param name
   * @param limit
   * @returns {Promise<*>}
   */
  accountRequest: async (email, name, code, requestType) =>  {
    const type = requestType.charAt(0).toUpperCase() + requestType.slice(1)
      const mailSub = `Account ${type} Request`;
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>This is a confirmation email to let you know that you have requested to ${type} your account.</div>
                <div>Your one time password is ${code}.</div>
            </td>
          </tr>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>Thanks for investing your faith in us.</div>
              <div>See you soon.</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'noreply@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Plan Upgrade Email.
   * @param email
   * @param name
   * @param planDetails
   * @returns {Promise<*>}
   */
  planUpgrade: async (email, name, planDetails) =>  {
      const mailSub = "Plan Upgraded"
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>Your plan has been upgrade to ${planDetails.name}.</div>
                <div>You have got ${planDetails.uniqueVisitorQouta} Unique Visitors.</div>
                <div>Unique Visitors Quota Left: ${planDetails.uniqueVisitorsQoutaLeft}.</div>
            </td>
          </tr>
        </table>
        <table border="0" cellPadding="0" cellSpacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed" width="100%">
          <tbody>
            <tr>
              <td align="center" class="outer-td" style="padding:0px 0px 0px 0px">
                <table border="0" cellPadding="0" cellSpacing="0" class="button-css__deep-table___2OZyb wrapper-mobile" style="text-align:left">
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="#097fff" class="inner-td" style="border-radius:6px;font-size:16px;text-align:center;background-color:inherit"><a style="background-color:#097fff;border:1px solid #333333;border-color:#097fff;border-radius:5px;border-width:1px;color:#ffffff;display:inline-block;font-family:arial,helvetica,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0px;line-height:16px;padding:12px 18px 12px 18px;text-align:center;text-decoration:none" href="https://useinfluence.co/login" target="_blank">Login</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>If you didn't requested this, contact customer care.</div>
              <div>&nbsp;</div>
              <div>Thanks!</div>

            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'support@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Affiliate Request Email.
   * @param email
   * @param name
   * @param affiliateDetails
   * @returns {Promise<*>}
   */
  affiliateRequest: async (email, name, affiliateDetails) =>  {
      const mailSub = "Signup Invite"
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey,</div>
                <div>&nbsp;</div>
                <div>${name} have sent you affiliation signup link.</div>
                <div>Signup using the link and reward will be added to your account on completion.</div>
                <div>Refer and earn more.</div>
            </td>
          </tr>
        </table>
        <table border="0" cellPadding="0" cellSpacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed" width="100%">
          <tbody>
            <tr>
              <td align="center" class="outer-td" style="padding:0px 0px 0px 0px">
                <table border="0" cellPadding="0" cellSpacing="0" class="button-css__deep-table___2OZyb wrapper-mobile" style="text-align:left">
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="#097fff" class="inner-td" style="border-radius:6px;font-size:16px;text-align:center;background-color:inherit"><a style="background-color:#097fff;border:1px solid #333333;border-color:#097fff;border-radius:5px;border-width:1px;color:#ffffff;display:inline-block;font-family:arial,helvetica,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0px;line-height:16px;padding:12px 18px 12px 18px;text-align:center;text-decoration:none" href="https://useinfluence.co/signup/${affiliateDetails.affiliateId}" target="_blank">Register Now</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>&nbsp;</div>
              <div>Thanks!</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'noreply@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Single Point Contact Request Email.
   * @param email
   * @param name
   * @returns {Promise<*>}
   */
  singlePointContact: async (email, name) =>  {
      const mailSub = "Need Help?"
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>Hope everything is going great with you on converting users on your website.Just checking if everything is good on your end or not.</div>
                <div>&nbsp;</div>
                <div>I am your account manager and your single point of contact.</div>
                <div>&nbsp;</div>
                <div>I'd like to get on a call with you and help you out in taking your next steps with the Influence journey.</div>
                <div>&nbsp;</div>
                <div>It'd be great if you can provide me 3 available times as per your schedule so that I can help you in setting up the account for you, and guide you on how to use the product in the best possible manner.</div>
                <div>&nbsp;</div>
                <div>If you have any other queries please feel free to reply back to this email and we'll speak to you :D</div>
                <div>&nbsp;</div>
                <div>Looking forward to hearing from you.</div>
            </td>
          </tr>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>Best Wishes</div>
              <div>Douglas Mehta</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'info@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Payment failed Email.
   * @param email
   * @param name
   * @returns {Promise<*>}
   */
  paymentFailed: async (email, name) =>  {
      const mailSub = "Payment Failed"
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>We just noticed that there is a slight error for the payment of your account with us. That's why we are reaching out to check with you on it.</div>
                <div>&nbsp;</div>
                <div>We believe that it is payment failure issue for your account. Can you please recheck it with the same card or try with a new one?</div>
                <div>&nbsp;</div>
                <div>If you are still facing any issues please reply to this email and we'll be happy to resolve your issues.</div>

            </td>
          </tr>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>Thanks!</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'noreply@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Deleting Account.
   * @param email
   * @param name
   * @returns {Promise<*>}
   */
  deletingAccount: async (email, name) =>  {
      const mailSub = "Deleting Your Data";
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>We just noticed that your account hasn't been cleared with any payments for this month. Just wanted to check if you'd be using our tool or not.</div>
                <div>&nbsp;</div>
                <div>If not, then the system will be removing your data in the coming days, to keep your data safe.So if you want to access your data instantly, then we'd request you to refresh your payments and you'll get instant access to your account.</div>
                <div>&nbsp;</div>
                <div>If in any case you need any other help, please feel free to reply to this email and we will get back to you shortly.</div>

            </td>
          </tr>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>Thanks!</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'noreply@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Closing Account Limit .
   * @param email
   * @param name
   * @returns {Promise<*>}
   */
  closingAccountLimit: async (email, name) =>  {
      const mailSub = "10% Account Limit Remaining";
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>We just saw that you have been getting more traffic on your website, and you are only 10% away from hitting your account limit.</div>
                <div>&nbsp;</div>
                <div>Just giving you a heads up.</div>
                <div>&nbsp;</div>
                <div>We’ll upgrade your account once it hits 105% of the account limit.</div>
                <div>In case you need any other help, please feel free to reply to this email and we will get back to you.</div>
            </td>
          </tr>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>See you soon.</div>
              <div>Thanks!</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'noreply@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },

  /**
   * Automatic Upgrade.
   * @param email
   * @param name
   * @returns {Promise<*>}
   */
  automaticUpgrade: async (email, name) =>  {
      const mailSub = "Your Account Has Been Upgraded";
      const content =`
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div>Hey ${name},</div>
                <div>&nbsp;</div>
                <div>This is a follow up to the last email. Your account has been upgraded to the next plan as we noticed your website was getting more traffic for this month than usual.</div>
                <div>&nbsp;</div>
                <div>We’ll keep you posted if in any case you reach your limit for this account as well.</div>
                <div>&nbsp;</div>
                <div>In case you need any other help, please feel free to reply to this email and we'll get back to you.</div>
            </td>
          </tr>
        </table>
        <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
              <div>Thanks!</div>
            </td>
          </tr>
        </table>
      `;

      var mytemp = template.commontemp(mailSub, name, content);

      let mailOptions = {
        from: 'noreply@useinfluence.co',
        to: email,
        subject: mailSub,
        html: mytemp
      };
      return send(mailOptions);
  },
};
