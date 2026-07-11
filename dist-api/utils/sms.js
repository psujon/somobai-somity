import axios from "axios";
export async function sendSms(phone, message, retryCount = 3) {
    let cleanPhone = phone.trim().replace(/\+/g, "").replace(/\s/g, "").replace(/-/g, "");
    if (cleanPhone.startsWith("01")) {
        cleanPhone = "88" + cleanPhone;
    }
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const payload = {
                apiKey: process.env.MIM_SMS_API_KEY,
                userName: process.env.MIM_SMS_USERNAME,
                senderName: process.env.MIM_SMS_SENDER_NAME,
                transactionType: "T",
                mobileNumber: cleanPhone,
                message: message,
                campaignName: "FVP_Alert"
            };
            const response = await axios.post("https://api.mimsms.com/api/V2/SMS", payload);
            const statusCode = response.data?.statusCode;
            if (statusCode == 200) {
                console.log(`[SMS Utility] SMS sent successfully to ${cleanPhone} on attempt ${attempt}`);
                return true;
            }
            else {
                console.log(`[SMS Utility] SMS attempt ${attempt} failed with status code ${statusCode}: ${response.data?.status || "Unknown error"}`);
            }
        }
        catch (error) {
            console.log(`[SMS Utility] SMS attempt ${attempt} network error:`, error.message || error);
            if (error.response?.data) {
                console.log(`[SMS Utility] SMS attempt ${attempt} error response data:`, JSON.stringify(error.response.data));
            }
        }
        if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    console.log(`[SMS Utility] Failed to send SMS to ${cleanPhone} after ${retryCount} attempts.`);
    return false;
}
