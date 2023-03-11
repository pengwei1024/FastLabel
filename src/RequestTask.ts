/**
 * 请求工具类
 */
export class RequestTask {

    /**
     * 发送 post form 请求
     * @param url url
     * @param data 参数
     */
    public static postForm(url: string, data: any) {
        return new Promise<any>((resolve, reject) => {
            const formData = new URLSearchParams();
            for (let i in data) {
                formData.append(i, data[i]);
            }
            fetch(url, {
                method: 'post',
                body: formData,
            }).then(response => {
                if (response.ok) {
                    return response.json()
                } else {
                    return {code: response.status, msg: response.status + ' - ' + response.statusText}
                }
            }).then(res => {
                resolve(res)
            }).catch(error => {
                reject(JSON.stringify(error))
            })
        })
    }

    /**
     * GET 请求
     * @param url url
     */
    public static get(url: string) {
        return new Promise<any>((resolve, reject) => {
            fetch(url).then(response => {
                if (response.ok) {
                    return response.json()
                } else {
                    return {code: response.status, msg: response.status + ' - ' + response.statusText}
                }
            }).then(res => {
                resolve(res)
            }).catch(error => {
                reject(JSON.stringify(error))
            })
        })
    }
}